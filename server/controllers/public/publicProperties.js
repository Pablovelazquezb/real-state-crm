const supabase = require("../../db/supabaseClient");

const PUBLIC_COLUMNS =
  "id, property_name, property_type, price, location, bedrooms, bathrooms, square_feet, description, status, created_at";

// La columna de fotos es opcional según la versión del esquema.
const PUBLIC_COLUMNS_WITH_PHOTOS = `${PUBLIC_COLUMNS}, property_photos`;

const publicShape = (row) => ({
  id: row.id,
  name: row.property_name,
  propertyType: row.property_type,
  price: Number(row.price) || null,
  location: row.location,
  bedrooms: row.bedrooms,
  bathrooms: row.bathrooms,
  squareFeet: row.square_feet,
  description: row.description,
  status: row.status,
  photos: Array.isArray(row.property_photos) ? row.property_photos.filter(Boolean) : [],
  createdAt: row.created_at,
});

/**
 * Consulta tolerante: si el esquema aún no tiene `property_photos`, se reintenta
 * sin esa columna en lugar de devolver un catálogo vacío.
 */
const queryProperties = async ({ id = null } = {}) => {
  const run = async (columns) => {
    let query = supabase.from("properties").select(columns).eq("deleted", false);
    if (id) query = query.eq("id", id).limit(1);
    else query = query.order("created_at", { ascending: false }).limit(60);
    return query;
  };

  let { data, error } = await run(PUBLIC_COLUMNS_WITH_PHOTOS);

  if (error && String(error.message || "").includes("property_photos")) {
    ({ data, error } = await run(PUBLIC_COLUMNS));
  }

  if (error) throw error;
  return data || [];
};

/**
 * Catálogo público de propiedades para la landing.
 * No requiere sesión y solo expone información comercial.
 */
const listProperties = async (req, res) => {
  try {
    const rows = await queryProperties();
    const properties = rows.map(publicShape);

    const zones = [
      ...new Set(
        properties
          .map((property) => String(property.location || "").split(",").pop()?.trim())
          .filter(Boolean),
      ),
    ];

    return res.status(200).json({ properties, zones, total: properties.length });
  } catch (error) {
    console.error("[Portal] Error al leer propiedades:", error.message);
    return res.status(200).json({ properties: [], zones: [], total: 0 });
  }
};

const viewProperty = async (req, res) => {
  try {
    const rows = await queryProperties({ id: req.params.id });

    if (!rows.length) {
      return res.status(404).json({ message: "Propiedad no encontrada." });
    }

    return res.status(200).json(publicShape(rows[0]));
  } catch (error) {
    console.error("[Portal] Error al leer la propiedad:", error.message);
    return res.status(500).json({ message: "No se pudo cargar la propiedad." });
  }
};

module.exports = { listProperties, viewProperty };
