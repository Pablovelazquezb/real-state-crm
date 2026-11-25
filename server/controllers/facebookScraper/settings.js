const ScraperSetting = require("../../model/schema/scraperSetting");

const DEFAULT_SETTINGS = {
  apifyToken: null,
  geminiKey: null,
  defaultResultsLimit: 40,
  aiEnrichDefault: false,
  pageSize: 12,
};

const envApifyToken = () => process.env.APIFY_TOKEN || null;
const envGeminiKey = () => process.env.GEMINI_API_KEY || null;

async function getDoc() {
  let doc = await ScraperSetting.findOne({ key: "default" });
  if (!doc) {
    doc = await ScraperSetting.create({ key: "default", ...DEFAULT_SETTINGS });
  }
  return doc;
}

/**
 * Configuración efectiva: primero lo guardado desde la UI, luego el .env.
 */
async function getSettings() {
  const doc = await getDoc();

  return {
    apifyToken: doc.apifyToken || envApifyToken(),
    apifyTokenSource: doc.apifyToken ? "panel" : envApifyToken() ? "env" : "none",
    geminiKey: doc.geminiKey || envGeminiKey(),
    geminiKeySource: doc.geminiKey ? "panel" : envGeminiKey() ? "env" : "none",
    defaultResultsLimit: doc.defaultResultsLimit || DEFAULT_SETTINGS.defaultResultsLimit,
    aiEnrichDefault: Boolean(doc.aiEnrichDefault),
    pageSize: doc.pageSize || DEFAULT_SETTINGS.pageSize,
  };
}

const maskSecret = (value) => {
  if (!value) return null;
  const clean = String(value);
  if (clean.length <= 8) return "••••••••";
  return `••••••••${clean.slice(-4)}`;
};

async function getPublicSettings() {
  const settings = await getSettings();
  return {
    hasApifyToken: Boolean(settings.apifyToken),
    apifyTokenMasked: maskSecret(settings.apifyToken),
    apifyTokenSource: settings.apifyTokenSource,
    hasGeminiKey: Boolean(settings.geminiKey),
    geminiKeyMasked: maskSecret(settings.geminiKey),
    geminiKeySource: settings.geminiKeySource,
    defaultResultsLimit: settings.defaultResultsLimit,
    aiEnrichDefault: settings.aiEnrichDefault,
    pageSize: settings.pageSize,
  };
}

/**
 * Actualiza la configuración. Un valor `null` explícito borra la credencial
 * guardada en la base (y deja de usar el .env como respaldo solo si se indica).
 */
async function updateSettings(payload = {}) {
  const doc = await getDoc();
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(payload, "apifyToken")) {
    patch.apifyToken = payload.apifyToken ? String(payload.apifyToken).trim() : null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "geminiKey")) {
    patch.geminiKey = payload.geminiKey ? String(payload.geminiKey).trim() : null;
  }
  if (payload.defaultResultsLimit !== undefined) {
    patch.defaultResultsLimit = Math.max(1, Math.min(Number(payload.defaultResultsLimit) || 40, 500));
  }
  if (payload.aiEnrichDefault !== undefined) {
    patch.aiEnrichDefault = Boolean(payload.aiEnrichDefault);
  }
  if (payload.pageSize !== undefined) {
    patch.pageSize = Math.max(6, Math.min(Number(payload.pageSize) || 12, 60));
  }

  const updated = await ScraperSetting.findOneAndUpdate({ key: "default" }, { $set: patch }, { new: true, upsert: true });
  return updated;
}

async function saveHealth(health) {
  await ScraperSetting.findOneAndUpdate(
    { key: "default" },
    { $set: { lastHealth: { ...health, checkedAt: new Date() } } },
    { upsert: true },
  );
}

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  getPublicSettings,
  updateSettings,
  getDoc,
  saveHealth,
  maskSecret,
};
