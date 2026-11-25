const mongoose = require("mongoose");

/**
 * Ejecución de extracción (job) contra el actor de Apify.
 * Se procesa en segundo plano para no bloquear peticiones HTTP ni la Raspberry Pi.
 */
const facebookJobSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["queued", "running", "succeeded", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    stage: { type: String, default: "En cola" },
    actorId: { type: String, default: "apify/facebook-groups-scraper" },
    urls: { type: [String], default: [] },
    sectorId: { type: String, default: null },
    sectorName: { type: String, default: null },
    resultsLimit: { type: Number, default: 40 },
    aiEnrich: { type: Boolean, default: false },
    runId: { type: String, default: null },
    datasetId: { type: String, default: null },
    itemsFetched: { type: Number, default: 0 },
    leadsCreated: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    error: { type: String, default: null },
    logs: { type: [String], default: [] },
    ownerId: { type: String, default: null, index: true },
    ownerName: { type: String, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "FacebookJobs",
  },
);

facebookJobSchema.index({ createdAt: -1 });

module.exports = mongoose.models.FacebookJob || mongoose.model("FacebookJob", facebookJobSchema);
