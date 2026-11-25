const mongoose = require("mongoose");

/**
 * Configuración del módulo Prospector FB (una sola fila, key = "default").
 * Permite cargar el token de Apify y la llave de Gemini desde la interfaz
 * sin tener que editar el .env en la Raspberry Pi.
 */
const scraperSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    apifyToken: { type: String, default: null },
    geminiKey: { type: String, default: null },
    defaultResultsLimit: { type: Number, default: 40 },
    aiEnrichDefault: { type: Boolean, default: false },
    pageSize: { type: Number, default: 12 },
    lastHealth: {
      apify: { type: String, default: "unknown" },
      gemini: { type: String, default: "unknown" },
      checkedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    collection: "ScraperSettings",
  },
);

module.exports = mongoose.models.ScraperSetting || mongoose.model("ScraperSetting", scraperSettingSchema);
