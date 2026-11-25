const mongoose = require("mongoose");

/**
 * Prospecto inmobiliario detectado en grupos de Facebook.
 * Colección independiente de Leads/Contacts para no ensuciar el CRM
 * hasta que un asesor decida convertirlo (lead.convertedLeadId).
 */
const facebookLeadSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true, unique: true, index: true },
    url: { type: String, default: "" },
    text: { type: String, default: "" },
    userName: { type: String, default: "Contacto Facebook" },
    groupName: { type: String, default: "Comunidad Inmobiliaria" },
    sectorId: { type: String, default: null },
    sectorName: { type: String, default: null },
    role: { type: String, default: "supply_rent", index: true },
    roleLabel: { type: String, default: "" },
    section: { type: String, default: "renta", index: true },
    posterType: { type: String, default: "particular" },
    roomiePrefs: {
      gender: { type: String, default: "Indistinto / Mixto" },
      profile: { type: String, default: "Profesionista / General" },
      pets: { type: String, default: "Consultar" },
      services: { type: String, default: "No especificado" },
    },
    propertyType: { type: String, default: "Inmueble" },
    zone: { type: String, default: "Zona Metropolitana", index: true },
    price: { type: Number, default: null },
    priceDisplay: { type: String, default: "" },
    phone: { type: String, default: null },
    urgency: { type: String, default: "Normal" },
    leadScore: { type: Number, default: 0, index: true },
    aiSummary: { type: String, default: "" },
    status: { type: String, default: "nuevo", index: true },
    dateStr: { type: String, default: "Reciente" },
    postedAt: { type: Date, default: null },
    source: { type: String, default: "facebook" },
    ownerId: { type: String, default: null, index: true },
    ownerName: { type: String, default: null },
    // Trazabilidad con el CRM
    convertedLeadId: { type: String, default: null },
    convertedAt: { type: Date, default: null },
    convertedBy: { type: String, default: null },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "FacebookLeads",
  },
);

facebookLeadSchema.index({ createdAt: -1 });
facebookLeadSchema.index({ status: 1, leadScore: -1 });

module.exports = mongoose.models.FacebookLead || mongoose.model("FacebookLead", facebookLeadSchema);
