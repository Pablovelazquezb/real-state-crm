const User = require("../model/schema/user");

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

/**
 * Devuelve el usuario de Mongo del token, o null si la sesión pertenece a un
 * usuario del CRM alojado en Supabase (id UUID).
 *
 * Nota: `User.findById(uuid)` lanza un CastError no controlado en cuanto la
 * consulta ocurre fuera de un try/catch (ese era el motivo de los 500 y de los
 * reinicios del servidor). Esta función nunca lanza.
 */
async function getMongoUser(req) {
  const id = req.user?.userId;

  if (!isObjectId(id)) return null;

  try {
    return await User.findById(id).populate("roles");
  } catch (error) {
    return null;
  }
}

module.exports = getMongoUser;
module.exports.isObjectId = isObjectId;
