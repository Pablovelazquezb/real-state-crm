const User = require("../model/schema/user");
const supabase = require("../db/supabaseClient");

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));

/**
 * Devuelve el rol efectivo del usuario autenticado, consultando Supabase
 * (usuarios actuales del CRM) y Mongo (usuarios históricos).
 */
const getRequesterRole = async (req) => {
  const id = req.user?.userId;
  if (!id) return null;

  if (isUuid(id)) {
    try {
      const { data } = await supabase
        .from("users")
        .select("role, deleted")
        .eq("id", id)
        .limit(1);

      const row = data?.[0];
      if (row && !row.deleted) return row.role;
    } catch (error) {
      return null;
    }
    return null;
  }

  try {
    const user = await User.findById(id);
    if (user && !user.deleted) return user.role;
  } catch (error) {
    return null;
  }

  return null;
};

/**
 * Restringe una ruta a super administradores.
 * Se usa en la gestión de usuarios y roles para que un empleado no pueda
 * crear administradores ni cambiar permisos por API.
 */
const requireSuperAdmin = async (req, res, next) => {
  const role = await getRequesterRole(req);

  if (String(role || "").toLowerCase() !== "superadmin") {
    return res.status(403).json({
      message: "Solo un super administrador puede realizar esta acción.",
    });
  }

  return next();
};

module.exports = requireSuperAdmin;
module.exports.getRequesterRole = getRequesterRole;
module.exports.isUuid = isUuid;
