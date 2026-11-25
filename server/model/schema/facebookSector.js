const mongoose = require("mongoose");

/**
 * Sector / zona de prospección con su lista de grupos de Facebook.
 * Equivale a sectors_config.json del scraper original.
 */
const facebookSectorSchema = new mongoose.Schema(
  {
    sectorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    urls: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "FacebookSectors",
  },
);

module.exports = mongoose.models.FacebookSector || mongoose.model("FacebookSector", facebookSectorSchema);
