const FacebookLead = require("../../model/schema/facebookLead");
const supabase = require("../../db/supabaseClient");
const { buildContactMessage, buildMatchPitch, buildRoomieMatchPitch, buildWhatsAppUrl } = require("./whatsapp");
const { getAllCrossMatches, findSmartMatches } = require("./dataProcessor");

// El catálogo histórico puede no estar presente (contiene datos personales y no
// se versiona). El módulo funciona igual; la importación avisa si falta.
let seedLeads = [];
try {
  seedLeads = require("../../data/facebookLeadsSeed.json");
} catch (error) {
  seedLeads = [];
}

const STATUSES = ["nuevo", "contactado", "favorito", "descartado", "convertido"];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Construye el filtro de Mongo a partir de los parámetros de la URL.
 */
function buildQuery(filters = {}, viewer = {}) {
  const query = {};

  if (filters.section && filters.section !== "all") query.section = filters.section;
  if (filters.role && filters.role !== "all") query.role = filters.role;
  if (filters.zone && filters.zone !== "all") query.zone = filters.zone;
  if (filters.posterType && filters.posterType !== "all") query.posterType = filters.posterType;
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.hotOnly === "true" || filters.hotOnly === true) query.leadScore = { $gte: 75 };
  if (filters.phoneOnly === "true" || filters.phoneOnly === true) {
    query.phone = { $nin: [null, ""] };
  }
  if (filters.mine === "true" || filters.mine === true) {
    query.ownerId = String(viewer.id || "");
  }

  const minPrice = toNumber(filters.minPrice);
  const maxPrice = toNumber(filters.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    query.price = { ...(query.price || {}) };
    if (minPrice !== null) query.price.$gte = minPrice;
    if (maxPrice !== null) query.price.$lte = maxPrice;
    if (query.price.$gte === undefined && query.price.$lte === undefined) delete query.price;
  }

  const search = String(filters.search || "").trim();
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ text: regex }, { userName: regex }, { zone: regex }, { groupName: regex }, { phone: regex }];
  }

  // Los posts de spam nunca se muestran salvo que se pidan explícitamente.
  if (!filters.status || filters.status === "all") query.role = query.role || { $ne: "spam" };

  return query;
}

const decorateLead = (lead) => {
  const plain = typeof lead.toObject === "function" ? lead.toObject() : lead;
  const contact = buildContactMessage(plain);

  return {
    ...plain,
    id: String(plain._id),
    whatsappUrl: contact.whatsappUrl,
    whatsappMessage: contact.message,
    priceLabel: plain.price ? `$${Number(plain.price).toLocaleString("es-MX")} MXN` : "A convenir",
  };
};

async function listLeads({ filters = {}, page = 1, limit = 12, sort = "recent", viewer = {} }) {
  const query = buildQuery(filters, viewer);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 12, 100));
  const safePage = Math.max(1, Number(page) || 1);

  const sortMap = {
    recent: { createdAt: -1 },
    score: { leadScore: -1, createdAt: -1 },
    priceDesc: { price: -1 },
    priceAsc: { price: 1 },
  };

  const [items, total] = await Promise.all([
    FacebookLead.find(query)
      .sort(sortMap[sort] || sortMap.recent)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    FacebookLead.countDocuments(query),
  ]);

  return {
    items: items.map(decorateLead),
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: safePage * safeLimit < total,
  };
}

async function getLeadById(id) {
  const lead = await FacebookLead.findById(id);
  return lead ? decorateLead(lead) : null;
}


/**
 * Mensaje y enlace de WhatsApp para presentar un cruce entre dos prospectos.
 */
const buildMatchContact = (demand, supply, isRoomie) => {
  const pitch = isRoomie
    ? buildRoomieMatchPitch(demand, supply)
    : buildMatchPitch(demand, supply);
  const targetPhone = demand.phone || supply.phone || null;

  return { pitch, whatsappUrl: buildWhatsAppUrl(targetPhone, pitch), targetPhone };
};

async function getMatches({ leadId } = {}) {
  const leads = await FacebookLead.find({ role: { $ne: "spam" } }).sort({ createdAt: -1 }).limit(1200).lean();

  if (leadId) {
    const target = leads.find((lead) => String(lead._id) === String(leadId));
    if (!target) return { matches: [], target: null };

    const matches = findSmartMatches(target, leads).map((match) => {
      const demand = decorateLead(target);
      const supply = decorateLead(match.lead);
      const isRoomie =
        String(target.role || "").startsWith("roomie") ||
        String(match.lead.role || "").startsWith("roomie") ||
        target.section === "roomies" ||
        match.lead.section === "roomies";

      return { score: match.score, reasons: match.reasons, demand, supply, isRoomie, ...buildMatchContact(demand, supply, isRoomie) };
    });

    return { matches, target: decorateLead(target) };
  }

  const matches = getAllCrossMatches(leads).map((match) => {
    const demand = decorateLead(match.demand);
    const supply = decorateLead(match.supply);
    return { score: match.score, reasons: match.reasons, demand, supply, isRoomie: match.isRoomie, ...buildMatchContact(demand, supply, match.isRoomie) };
  });

  return { matches, target: null };
}

/**
 * Inserta un lote deduplicando por postId. Devuelve métricas del proceso.
 */
async function upsertLeads(leads) {
  if (!Array.isArray(leads) || leads.length === 0) {
    return { created: 0, duplicates: 0, skipped: 0, ids: [] };
  }

  const operations = [];
  let skipped = 0;

  for (const lead of leads) {
    if (!lead.postId || lead.role === "spam") {
      skipped += 1;
      continue;
    }

    const { postId, ...rest } = lead;
    operations.push({
      updateOne: {
        filter: { postId: String(postId) },
        update: { $setOnInsert: { ...rest, postId: String(postId) } },
        upsert: true,
      },
    });
  }

  if (operations.length === 0) return { created: 0, duplicates: 0, skipped, ids: [] };

  let result;
  try {
    result = await FacebookLead.bulkWrite(operations, { ordered: false });
  } catch (error) {
    // Puede lanzar por índices duplicados en concurrencia; los documentos nuevos sí se insertan.
    result = error?.result || { upsertedCount: 0, matchedCount: 0, insertedCount: 0 };
  }

  const created = result?.upsertedCount ?? result?.insertedCount ?? 0;
  const matched = result?.matchedCount ?? Math.max(operations.length - created, 0);

  return { created, duplicates: matched, skipped, ids: [] };
}

async function updateLeadStatus(id, status) {
  if (!STATUSES.includes(status)) {
    throw Object.assign(new Error("Estado no válido."), { status: 400 });
  }

  const lead = await FacebookLead.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  if (!lead) throw Object.assign(new Error("Prospecto no encontrado."), { status: 404 });
  return decorateLead(lead);
}

async function updateLeadNotes(id, notes) {
  const lead = await FacebookLead.findByIdAndUpdate(id, { $set: { notes: String(notes || "") } }, { new: true });
  if (!lead) throw Object.assign(new Error("Prospecto no encontrado."), { status: 404 });
  return decorateLead(lead);
}

async function deleteLead(id) {
  const lead = await FacebookLead.findByIdAndDelete(id);
  if (!lead) throw Object.assign(new Error("Prospecto no encontrado."), { status: 404 });
  return { deleted: true };
}

async function getStats(viewer = {}) {
  const baseQuery = viewer.mine ? { ownerId: String(viewer.id || "") } : {};

  const [totals, grouped, zones, convertedCount] = await Promise.all([
    FacebookLead.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          hot: { $sum: { $cond: [{ $gte: ["$leadScore", 75] }, 1, 0] } },
          withPhone: { $sum: { $cond: [{ $ne: [{ $ifNull: ["$phone", null] }, null] }, 1, 0] } },
          renta: { $sum: { $cond: [{ $eq: ["$section", "renta"] }, 1, 0] } },
          demanda: { $sum: { $cond: [{ $eq: ["$section", "demanda"] }, 1, 0] } },
          roomies: { $sum: { $cond: [{ $eq: ["$section", "roomies"] }, 1, 0] } },
          nuevos: { $sum: { $cond: [{ $eq: ["$status", "nuevo"] }, 1, 0] } },
          contactados: { $sum: { $cond: [{ $eq: ["$status", "contactado"] }, 1, 0] } },
          favoritos: { $sum: { $cond: [{ $eq: ["$status", "favorito"] }, 1, 0] } },
          descartados: { $sum: { $cond: [{ $eq: ["$status", "descartado"] }, 1, 0] } },
        },
      },
    ]),
    FacebookLead.aggregate([{ $match: baseQuery }, { $group: { _id: "$section", count: { $sum: 1 } } }]),
    FacebookLead.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$zone", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    FacebookLead.countDocuments({ ...baseQuery, status: "convertido" }),
  ]);

  const all = await FacebookLead.find({ role: { $ne: "spam" } })
    .select("postId role section zone price roomiePrefs leadScore")
    .lean();
  const matches = all.length > 1 ? getAllCrossMatches(all).length : 0;

  const stats = totals[0] || {
    total: 0, hot: 0, withPhone: 0, renta: 0, demanda: 0, roomies: 0,
    nuevos: 0, contactados: 0, favoritos: 0, descartados: 0,
  };

  return {
    ...stats,
    total: stats.total || 0,
    converted: convertedCount,
    matches,
    bySection: grouped.reduce((acc, item) => ({ ...acc, [item._id || "otro"]: item.count }), {}),
    byZone: zones.filter((zone) => zone._id).map((zone) => ({ zone: zone._id, count: zone.count })),
    leadCount: all.length,
  };
}

/**
 * Convierte un prospecto de Facebook en un Lead del CRM (Supabase).
 * Evita duplicados guardando el id del lead creado.
 */
async function convertToCrmLead(id, user = {}) {
  const lead = await FacebookLead.findById(id);
  if (!lead) throw Object.assign(new Error("Prospecto no encontrado."), { status: 404 });
  if (lead.convertedLeadId) {
    return { alreadyConverted: true, lead: decorateLead(lead), crmLeadId: lead.convertedLeadId };
  }

  const notes = [
    `Origen: grupo de Facebook "${lead.groupName}"`,
    lead.aiSummary ? `Resumen: ${lead.aiSummary}` : null,
    lead.zone ? `Zona: ${lead.zone}` : null,
    lead.priceDisplay ? `Precio detectado: ${lead.priceDisplay}` : null,
    lead.url ? `Publicación: ${lead.url}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    lead_name: lead.userName || "Prospecto Facebook",
    lead_email: null,
    lead_phone_number: lead.phone || null,
    lead_address: lead.zone || null,
    lead_status: "New",
    lead_source: "Grupos de Facebook",
    lead_owner: null,
    notes,
  };

  if (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(user.id))) {
    payload.lead_owner = String(user.id);
  }

  const { data, error } = await supabase.from("leads").insert([payload]).select("id").single();

  if (error) {
    throw Object.assign(
      new Error(`No se pudo crear el Lead en el CRM: ${error.message}`),
      { status: 502 },
    );
  }

  lead.convertedLeadId = data?.id || null;
  lead.convertedAt = new Date();
  lead.convertedBy = user?.name || null;
  lead.status = "convertido";
  await lead.save();

  return { alreadyConverted: false, lead: decorateLead(lead), crmLeadId: lead.convertedLeadId };
}

const CSV_HEADERS = [
  "Rol / Intención",
  "Nombre",
  "Teléfono / WhatsApp",
  "Zona",
  "Tipo Inmueble",
  "Precio",
  "Score",
  "Urgencia",
  "Estado",
  "Grupo",
  "Fecha",
  "Enlace Facebook",
];

const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

async function exportLeads({ filters = {}, format = "csv", viewer = {} }) {
  const query = buildQuery(filters, viewer);
  const leads = await FacebookLead.find(query).sort({ createdAt: -1 }).limit(5000).lean();

  if (format === "json") {
    return {
      content: JSON.stringify(leads, null, 2),
      mime: "application/json",
      filename: `prospectos-facebook-${new Date().toISOString().slice(0, 10)}.json`,
      total: leads.length,
    };
  }

  const rows = leads.map((lead) =>
    [
      lead.roleLabel,
      lead.userName,
      lead.phone || "No detectado",
      lead.zone,
      lead.propertyType,
      lead.priceDisplay,
      lead.leadScore,
      lead.urgency,
      lead.status,
      lead.groupName,
      lead.dateStr,
      lead.url,
    ]
      .map(csvCell)
      .join(","),
  );

  // BOM para que Excel respete acentos.
  const content = `\uFEFF${CSV_HEADERS.join(",")}\n${rows.join("\n")}`;

  return {
    content,
    mime: "text/csv;charset=utf-8",
    filename: `prospectos-facebook-${new Date().toISOString().slice(0, 10)}.csv`,
    total: leads.length,
  };
}

/**
 * Importa el catálogo histórico del scraper original (46 prospectos reales).
 */
async function importSeedData() {
  if (!Array.isArray(seedLeads) || seedLeads.length === 0) {
    return {
      created: 0,
      duplicates: 0,
      skipped: 0,
      ids: [],
      message:
        "No hay catálogo histórico en este servidor (los datos personales no se versionan). " +
        "Puedes cargarlo en server/data/facebookLeadsSeed.json o lanzar una extracción nueva.",
    };
  }

  const normalized = seedLeads.map((lead) => ({
    ...lead,
    source: "facebook",
    ownerId: null,
    ownerName: "Importado del scraper",
  }));

  const result = await upsertLeads(normalized);
  return result;
}

async function clearAll() {
  const result = await FacebookLead.deleteMany({});
  return { deleted: result.deletedCount || 0 };
}

module.exports = {
  STATUSES,
  buildQuery,
  listLeads,
  getLeadById,
  getMatches,
  upsertLeads,
  updateLeadStatus,
  updateLeadNotes,
  deleteLead,
  getStats,
  convertToCrmLead,
  exportLeads,
  importSeedData,
  clearAll,
  decorateLead,
};
