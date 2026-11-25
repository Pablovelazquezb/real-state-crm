const FacebookSector = require("../../model/schema/facebookSector");
const defaultSectors = require("../../data/sectorsConfig.json");
const { normalizeFacebookGroupUrl, cleanUrls } = require("./apify");

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "sector_custom";

/**
 * Carga los sectores del scraper original la primera vez que arranca el módulo.
 */
async function seedSectors() {
  const count = await FacebookSector.estimatedDocumentCount();
  if (count > 0) return { seeded: false, count };

  const docs = (defaultSectors.sectors || []).map((sector, index) => ({
    sectorId: sector.id,
    name: sector.name,
    description: sector.description || "",
    urls: cleanUrls(sector.urls || []),
    order: index,
    active: true,
  }));

  if (docs.length) await FacebookSector.insertMany(docs);
  return { seeded: docs.length > 0, count: docs.length };
}

async function listSectors() {
  const sectors = await FacebookSector.find({}).sort({ order: 1, createdAt: 1 }).lean();
  return sectors.map((sector) => ({
    ...sector,
    id: String(sector._id),
    urls: sector.urls || [],
    urlCount: (sector.urls || []).length,
  }));
}

async function getSector(idOrSlug) {
  if (!idOrSlug) return null;

  const conditions = [{ sectorId: String(idOrSlug) }];
  if (/^[a-f\d]{24}$/i.test(String(idOrSlug))) conditions.push({ _id: idOrSlug });

  return FacebookSector.findOne({ $or: conditions }).lean();
}

async function createSector({ name, description = "" }) {
  const cleanName = String(name || "").trim();
  if (!cleanName) throw Object.assign(new Error("El nombre del sector es obligatorio."), { status: 400 });

  let sectorId = slugify(cleanName);
  if (await FacebookSector.exists({ sectorId })) {
    sectorId = `${sectorId}_${Date.now().toString(36).slice(-4)}`;
  }

  const last = await FacebookSector.findOne({}).sort({ order: -1 }).lean();
  return FacebookSector.create({
    sectorId,
    name: cleanName,
    description: String(description || "").trim(),
    urls: [],
    order: (last?.order || 0) + 1,
    active: true,
  });
}

async function updateSector(id, payload = {}) {
  const patch = {};
  if (payload.name !== undefined) patch.name = String(payload.name).trim();
  if (payload.description !== undefined) patch.description = String(payload.description).trim();
  if (payload.active !== undefined) patch.active = Boolean(payload.active);
  return FacebookSector.findByIdAndUpdate(id, { $set: patch }, { new: true });
}

async function deleteSector(id) {
  return FacebookSector.findByIdAndDelete(id);
}

async function addUrlToSector(id, rawUrl) {
  const url = normalizeFacebookGroupUrl(rawUrl);
  if (!url) throw Object.assign(new Error("Ingresa una URL válida de grupo."), { status: 400 });

  const sector = await FacebookSector.findById(id);
  if (!sector) throw Object.assign(new Error("Sector no encontrado."), { status: 404 });

  if (sector.urls.includes(url)) return { sector, added: false };
  sector.urls.push(url);
  await sector.save();
  return { sector, added: true };
}

async function removeUrlFromSector(id, url) {
  const sector = await FacebookSector.findById(id);
  if (!sector) throw Object.assign(new Error("Sector no encontrado."), { status: 404 });

  const before = sector.urls.length;
  sector.urls = sector.urls.filter((item) => item !== url);
  await sector.save();
  return { sector, removed: before !== sector.urls.length };
}

async function getUrlsForSector(id) {
  const sector = await getSector(id);
  if (!sector) return { urls: [], sector: null };
  return { urls: cleanUrls(sector.urls || []), sector };
}

async function allConfiguredUrls() {
  const sectors = await FacebookSector.find({ active: true }).lean();
  return cleanUrls(sectors.flatMap((sector) => sector.urls || []));
}

module.exports = {
  seedSectors,
  listSectors,
  getSector,
  createSector,
  updateSector,
  deleteSector,
  addUrlToSector,
  removeUrlFromSector,
  getUrlsForSector,
  allConfiguredUrls,
  slugify,
};
