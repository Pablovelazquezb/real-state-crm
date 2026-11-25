const customField = require("../../model/schema/customField");
const RoleAccess = require("../../model/schema/roleAccess");
const User = require("../../model/schema/user");
const supabase = require("../../db/supabaseClient");

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));

const defaultSuperAdminRole = [{
  _id: "superAdminRole",
  roleName: "superAdmin",
  description: "Super Admin Access",
  access: [
    { title: "Leads", create: true, update: true, delete: true, view: true },
    { title: "Contacts", create: true, update: true, delete: true, view: true },
    { title: "Properties", create: true, update: true, delete: true, view: true },
    { title: "Tasks", create: true, update: true, delete: true, view: true },
    { title: "Meetings", create: true, update: true, delete: true, view: true }
  ]
}];

const index = async (req, res) => {
  try {
    const query = req.query;
    let result = await RoleAccess.find(query);
    return res.send((result && result.length > 0) ? result : defaultSuperAdminRole);
  } catch (err) {
    return res.send(defaultSuperAdminRole);
  }
};

const add = async (req, res) => {
  try {
    const { roleName, description, access } = req.body;

    const existingRole = await RoleAccess.findOne({
      roleName: { $regex: new RegExp(`^${roleName}$`, "i") },
    }).exec();
    if (existingRole) {
      return res
        .status(400)
        .json({ message: `${roleName} Role already exist` });
    } else {
      const createdDate = new Date();

      // Solo los módulos que se usan en esta instalación (menú simplificado).
      const titles = [
        "Properties",
        "Leads",
        "Contacts",
        "Prospector FB",
      ];

      const customModules = Array.from(
        await customField.find(),
        (item) => item.moduleName
      );

      async function processModules() {
        for (const module of customModules) {
          const item = await customField.findOne({ moduleName: module });
          if (item && !item.deleted && !titles?.includes(module)) {
            titles.push(module);
          }
        }
      }
      // Call the async function
      processModules()
        .then(async () => {
          const accessData = [];

          const ignoreAlreadyGivenTitles = access?.map((item) => item?.title);

          await titles?.forEach((item) => {
            if (!ignoreAlreadyGivenTitles?.includes(item)) {
              accessData?.push({
                title: item,
                create: false,
                update: false,
                delete: false,
                // El Prospector FB se habilita por defecto para que los empleados
                // lo vean en el menú; el administrador puede quitarlo desde Roles.
                view: item === "Prospector FB",
              });
            } else {
              const currentRolePermission = access?.find(
                (aItem) => aItem?.title === item
              );
              accessData?.push({ ...currentRolePermission });
            }
          });

          const role = new RoleAccess({
            roleName: roleName,
            description,
            access: accessData,
            createdDate,
          });
          await role?.save();

          return res
            .status(200)
            .json({ message: `${roleName} Role created successfully` });
        })
        .catch((error) => {
          console.error("Error occurred:", error);
        });
    }
  } catch (err) {
    console.error("Failed to create role:", err);
    return res
      .status(400)
      .json({ message: `Failed to create role`, err: err.toString() });
  }
};

const edit = async (req, res) => {
  try {
    req.body.modifyDate = new Date();
    let result = await RoleAccess.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("Failed to Update Role Access:", err);
    return res.status(400).json({ error: "Failed to Update Role Access" });
  }
};

const roleAssignedUsers = async (req, res) => {
  try {
    const role = await RoleAccess.findById(req.params.id).lean();
    const roleName = role?.roleName;

    // Usuarios del CRM (Supabase) asignados a este rol
    if (roleName) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("deleted", false)
        .ilike("role", roleName);

      if (!error && data) {
        const supabaseUsers = data.map((u) => ({
          _id: u.id,
          username: u.username,
          firstName: u.first_name,
          lastName: u.last_name,
          phoneNumber: u.phone_number,
          role: u.role,
          roles: [],
        }));

        let mongoUsers = [];
        try {
          mongoUsers = await User.find({
            roles: { $in: [req.params.id] },
            deleted: false,
          });
        } catch (error) {
          mongoUsers = [];
        }

        return res.send([...supabaseUsers, ...mongoUsers]);
      }
    }

    const result = await User.find({
      roles: { $in: [req.params.id] },
      deleted: false,
    });
    return res.send(result);
  } catch (err) {
    console.error("Error :", err);
    return res.status(400).json({ err, error: "Something wents wrong" });
  }
};

const assignRoleToUsers = async (req, res) => {
  const selected = Array.isArray(req.body) ? req.body : [];
  const supabaseIds = selected.filter(isUuid);
  const mongoIds = selected.filter((id) => /^[a-f\d]{24}$/i.test(String(id)));

  let updated = 0;

  // 1) Usuarios del CRM (Supabase): la columna `role` toma el nombre del rol.
  if (supabaseIds.length > 0) {
    try {
      const role = await RoleAccess.findById(req.params.id).lean();

      if (!role?.roleName) {
        return res.status(404).json({ message: "Rol no encontrado." });
      }

      const { data, error } = await supabase
        .from("users")
        .update({ role: role.roleName, updated_at: new Date() })
        .in("id", supabaseIds)
        .select("id");

      if (error) {
        console.error("Supabase role assign error:", error.message);
        return res.status(400).json({ message: "No se pudo asignar el rol en Supabase." });
      }

      updated += (data || []).length;
    } catch (error) {
      console.error("Supabase role assign error:", error.message);
      return res.status(400).json({ message: "No se pudo asignar el rol." });
    }
  }

  // 2) Usuarios históricos de Mongo (compatibilidad)
  if (mongoIds.length > 0) {
    try {
      const bulkOperations = [
        {
          updateMany: {
            filter: { _id: { $in: mongoIds }, deleted: false },
            update: { $addToSet: { roles: req.params.id } },
          },
        },
      ];

      const result = await User.bulkWrite(bulkOperations);
      updated += result?.modifiedCount || 0;
    } catch (err) {
      console.error("Error :", err);
      return res.status(400).json({ err, message: "Something wents wrong" });
    }
  }

  return res.send({ message: "Role changed successfully", updated });
};

module.exports = { index, add, edit, roleAssignedUsers, assignRoleToUsers };
