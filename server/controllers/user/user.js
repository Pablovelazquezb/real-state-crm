const User = require("../../model/schema/user");
const RoleAccess = require("../../model/schema/roleAccess");
const supabase = require("../../db/supabaseClient");
const { getRequesterRole } = require("../../middelwares/requireSuperAdmin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));

const formatSupabaseUser = (row) => ({
  _id: row.id,
  username: row.username,
  firstName: row.first_name,
  lastName: row.last_name,
  phoneNumber: row.phone_number,
  role: row.role,
  roles: [],
});

/**
 * Los usuarios del CRM viven en Supabase con un rol de texto ("Empleado", "Sales"...).
 * Se ancla ese rol al documento de permisos de Mongo para que el menú y las
 * pantallas se habiliten igual que con los usuarios históricos de Mongo.
 */
const resolveAccessRoles = async (roleName) => {
  if (!roleName || String(roleName).toLowerCase() === "superadmin") return [];

  try {
    const role = await RoleAccess.findOne({
      roleName: new RegExp(`^${String(roleName)}$`, "i"),
    }).lean();

    return role ? [role] : [];
  } catch (error) {
    return [];
  }
};

const countOtherSuperAdmins = async (excludeId) => {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("role", "superAdmin")
    .eq("deleted", false);

  if (error) return 0;
  return (data || []).filter((row) => String(row.id) !== String(excludeId)).length;
};

/**
 * Devuelve el nombre canónico del rol. Acepta "user", "superAdmin" o el nombre
 * de un rol existente en el módulo de Roles.
 */
const validRole = async (role) => {
  const candidate = String(role || "user").trim();
  if (!candidate) return "user";
  if (candidate.toLowerCase() === "superadmin") return "superAdmin";
  if (candidate.toLowerCase() === "user") return "user";

  const exists = await RoleAccess.findOne({
    roleName: new RegExp(`^${candidate}$`, "i"),
  }).lean();

  return exists ? exists.roleName : null;
};

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

// Admin register (compatibilidad con el flujo histórico de Mongo)
const adminRegister = async (req, res) => {
  try {
    const { username, password, firstName, lastName, phoneNumber } = req.body;
    const user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({
        message: "Admin already exist please try another email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = new User({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: "superAdmin",
    });
    await created.save();

    return res.status(200).json({ message: "Admin created successfully" });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

// User Registration
const register = async (req, res) => {
  try {
    const requesterRole = await getRequesterRole(req);
    if (String(requesterRole || "").toLowerCase() !== "superadmin") {
      return res.status(403).json({ message: "Solo un super administrador puede crear usuarios." });
    }

    const { username, password, firstName, lastName, phoneNumber, roles, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "El correo y la contraseña son obligatorios." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Alta legacy con roles de Mongo (solo si no se indicó un rol por nombre)
    if (!role && Array.isArray(roles) && roles.length > 0) {
      const existingMongo = await User.findOne({ username });
      if (existingMongo) {
        return res.status(401).json({ message: "user already exist please try another email" });
      }

      const user = new User({
        username,
        password: hashedPassword,
        roles,
        firstName,
        lastName,
        phoneNumber,
        createdDate: new Date(),
      });
      await user.save();
      return res.status(200).json({ message: "User created successfully" });
    }

    const finalRole = await validRole(role);
    if (!finalRole) {
      return res.status(400).json({ message: "El rol seleccionado no existe. Créalo primero en Roles." });
    }

    const { data: duplicated, error: duplicatedError } = await supabase
      .from("users")
      .select("id")
      .eq("username", String(username).trim())
      .limit(1);

    if (!duplicatedError && duplicated?.length > 0) {
      return res.status(400).json({ message: "Ese correo ya está registrado. Usa otro." });
    }

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username: String(username).trim(),
          password: hashedPassword,
          first_name: firstName || null,
          last_name: lastName || null,
          phone_number: phoneNumber ? String(phoneNumber) : null,
          role: finalRole,
          deleted: false,
        },
      ])
      .select("id, username, first_name, last_name, phone_number, role")
      .single();

    if (error) {
      // Respaldo en Mongo si Supabase no está disponible.
      const existingMongo = await User.findOne({ username });
      if (existingMongo) {
        return res.status(400).json({ message: "Ese correo ya está registrado. Usa otro." });
      }

      await User.create({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        role: finalRole,
        createdDate: new Date(),
      });

      return res.status(200).json({ message: "User created successfully (base local)" });
    }

    return res.status(200).json({
      message: "User created successfully",
      user: formatSupabaseUser(data),
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return res.status(500).json({ message: "No se pudo crear el usuario." });
  }
};

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

const index = async (req, res) => {
  try {
    const { data: supuUsers, error } = await supabase
      .from("users")
      .select("*")
      .eq("deleted", false)
      .order("created_at", { ascending: true });

    if (!error && supuUsers) {
      const formatted = supuUsers.map((u) => ({
        _id: u.id,
        username: u.username,
        firstName: u.first_name,
        lastName: u.last_name,
        phoneNumber: u.phone_number,
        role: u.role,
        roles: [],
      }));
      return res.status(200).json({ user: formatted });
    }
  } catch (e) {
    console.log("Supabase user index error:", e.message);
  }

  try {
    const query = { ...req.query, deleted: false };
    const user = await User.find(query).exec();
    return res.status(200).json({ user: user || [] });
  } catch (error) {
    return res.status(200).json({ user: [] });
  }
};

const view = async (req, res) => {
  try {
    const requesterRole = await getRequesterRole(req);
    const isAdmin = String(requesterRole || "").toLowerCase() === "superadmin";

    if (!isAdmin && String(req.params.id) !== String(req.user?.userId)) {
      return res.status(403).json({ message: "No puedes consultar otro usuario." });
    }

    const { data: supuUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (!error && supuUser) {
      return res.status(200).json({
        _id: supuUser.id,
        username: supuUser.username,
        firstName: supuUser.first_name,
        lastName: supuUser.last_name,
        phoneNumber: supuUser.phone_number,
        role: supuUser.role,
        roles: [],
      });
    }
  } catch (e) {
    // continúa con Mongo
  }

  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: "no Data Found." });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(200).json({
      _id: req.params.id,
      username: "admin@gmail.com",
      firstName: "Nova",
      lastName: "Admin",
      role: "superAdmin",
    });
  }
};

// ---------------------------------------------------------------------------
// Eliminación (baja lógica)
// ---------------------------------------------------------------------------

/**
 * Reglas de seguridad:
 * - nadie puede eliminar su propia cuenta;
 * - no se puede eliminar al último super administrador activo.
 */
const canDelete = async (targetId, targetRole, requesterId) => {
  if (String(targetId) === String(requesterId)) {
    return { allowed: false, message: "No puedes eliminar tu propia cuenta." };
  }

  if (String(targetRole).toLowerCase() === "superadmin") {
    const others = await countOtherSuperAdmins(targetId);
    if (others === 0) {
      return { allowed: false, message: "No puedes eliminar al último super administrador." };
    }
  }

  return { allowed: true };
};

const deleteData = async (req, res) => {
  try {
    const targetId = req.params.id;
    const requesterId = req.user?.userId;

    if (isUuid(targetId)) {
      const { data: rows } = await supabase
        .from("users")
        .select("id, username, role, deleted")
        .eq("id", targetId)
        .limit(1);

      const target = rows?.[0];

      if (target) {
        const check = await canDelete(target.id, target.role, requesterId);
        if (!check.allowed) return res.status(400).json({ message: check.message });

        const { error } = await supabase
          .from("users")
          .update({ deleted: true, updated_at: new Date() })
          .eq("id", target.id);

        if (!error) {
          return res.send({ message: "Record deleted Successfully" });
        }

        return res.status(400).json({ message: "No se pudo eliminar el usuario en Supabase." });
      }
    }

    // Respaldo/legacy en Mongo
    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const check = await canDelete(user._id, user.role, requesterId);
    if (!check.allowed) return res.status(400).json({ message: check.message });

    await User.updateOne({ _id: targetId }, { $set: { deleted: true } });
    return res.send({ message: "Record deleted Successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return res.status(500).json({ message: "No se pudo eliminar el usuario." });
  }
};

const deleteMany = async (req, res) => {
  try {
    const ids = Array.isArray(req.body) ? req.body : [];
    const requesterId = req.user?.userId;
    let deleted = 0;
    const skipped = [];

    for (const id of ids) {
      if (isUuid(id)) {
        const { data: rows } = await supabase
          .from("users")
          .select("id, username, role")
          .eq("id", id)
          .limit(1);

        const target = rows?.[0];
        if (!target) {
          skipped.push(String(id));
          continue;
        }

        const check = await canDelete(target.id, target.role, requesterId);
        if (!check.allowed) {
          skipped.push(target.username || String(id));
          continue;
        }

        const { error } = await supabase
          .from("users")
          .update({ deleted: true, updated_at: new Date() })
          .eq("id", target.id);

        if (!error) deleted += 1;
      } else {
        try {
          const user = await User.findById(id);
          if (!user) {
            skipped.push(String(id));
            continue;
          }

          const check = await canDelete(user._id, user.role, requesterId);
          if (!check.allowed) {
            skipped.push(user.username);
            continue;
          }

          await User.updateOne({ _id: id }, { $set: { deleted: true } });
          deleted += 1;
        } catch (error) {
          skipped.push(String(id));
        }
      }
    }

    return res.status(200).json({
      message: deleted > 0 ? "done" : "No se eliminó ningún usuario.",
      deleted,
      skipped,
    });
  } catch (err) {
    console.error("Failed to delete users:", err);
    return res.status(400).json({ message: "error", err: err.message });
  }
};

// ---------------------------------------------------------------------------
// Edición
// ---------------------------------------------------------------------------

const edit = async (req, res) => {
  try {
    const { username, firstName, lastName, phoneNumber, role } = req.body;
    const id = req.params.id;

    const requesterRole = await getRequesterRole(req);
    const isAdmin = String(requesterRole || "").toLowerCase() === "superadmin";

    if (!isAdmin && String(id) !== String(req.user?.userId)) {
      return res.status(403).json({ message: "No puedes editar otro usuario." });
    }

    if (isUuid(id)) {
      const { data: current, error: currentError } = await supabase
        .from("users")
        .select("id, role, username, first_name, last_name")
        .eq("id", id)
        .limit(1);

      const target = current?.[0];

      if (!currentError && target) {
        const patch = {
          first_name: firstName ?? target.first_name ?? null,
          last_name: lastName ?? null,
          phone_number: phoneNumber ? String(phoneNumber) : null,
          updated_at: new Date(),
        };

        if (username && isAdmin) patch.username = String(username).trim();

        if (role && role !== target.role && isAdmin) {
          const finalRole = await validRole(role);
          if (!finalRole) {
            return res.status(400).json({ message: "El rol seleccionado no existe." });
          }

          if (
            target.role === "superAdmin" &&
            finalRole !== "superAdmin" &&
            (await countOtherSuperAdmins(id)) === 0
          ) {
            return res
              .status(400)
              .json({ message: "No puedes quitar el rol al último super administrador." });
          }

          patch.role = finalRole;
        }

        const { data, error } = await supabase
          .from("users")
          .update(patch)
          .eq("id", id)
          .select("id, username, first_name, last_name, phone_number, role")
          .single();

        if (!error) {
          return res.status(200).json({
            message: "Usuario actualizado",
            user: formatSupabaseUser(data),
          });
        }
      }
    }

    // Respaldo/legacy en Mongo
    const patch = { username, firstName, lastName, phoneNumber };
    if (role) {
      const finalRole = await validRole(role);
      if (finalRole) patch.role = finalRole;
    }

    const result = await User.updateOne({ _id: id }, { $set: patch });
    return res.status(200).json(result);
  } catch (err) {
    console.error("Failed to Update User:", err);
    return res.status(400).json({ error: "Failed to Update User" });
  }
};

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Usuarios del CRM en Supabase
    let user = null;
    try {
      const { data: supuUsers, error: supuErr } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("deleted", false);

      if (!supuErr && supuUsers && supuUsers.length > 0) {
        const dbUser = supuUsers[0];
        user = {
          _id: dbUser.id,
          username: dbUser.username,
          password: dbUser.password,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          phoneNumber: dbUser.phone_number,
          role: dbUser.role,
          roles: await resolveAccessRoles(dbUser.role),
        };
      }
    } catch (e) {
      console.log("Supabase user query error:", e.message);
    }

    // 2. Respaldo en Mongo
    if (!user) {
      try {
        user = await User.findOne({ username, deleted: false }).populate({
          path: "roles",
        });
      } catch (mErr) {
        console.log("Mongo user lookup error:", mErr.message);
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Authentication failed, invalid username" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed, password does not match" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "secret_key", {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .setHeader("Authorization", `Bearer ${token}`)
      .json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "An error occurred during login" });
  }
};

const changeRoles = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await User.updateOne({ _id: userId }, { $set: { roles: req.body } });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Failed to Change Role:", error);
    return res.status(400).json({ error: "Failed to Change Role" });
  }
};

module.exports = {
  register,
  login,
  adminRegister,
  index,
  deleteMany,
  view,
  deleteData,
  edit,
  changeRoles,
};
