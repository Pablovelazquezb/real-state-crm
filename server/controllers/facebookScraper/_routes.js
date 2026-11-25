const express = require("express");
const auth = require("../../middelwares/auth");
const controller = require("./controller");

const router = express.Router();

router.get("/", auth, controller.index);
router.get("/bootstrap", auth, controller.bootstrap);
router.get("/stats", auth, controller.getStats);

// Prospectos
router.get("/leads", auth, controller.getLeads);
router.get("/leads/:id", auth, controller.getLead);
router.put("/leads/:id/status", auth, controller.changeStatus);
router.put("/leads/:id/notes", auth, controller.saveNotes);
router.delete("/leads/:id", auth, controller.removeLead);
router.post("/leads/:id/convert", auth, controller.convertLead);
router.post("/export", auth, controller.exportLeads);
router.post("/import-seed", auth, controller.importSeed);

// Cruces inteligentes
router.get("/matches", auth, controller.matches);

// Extracciones
router.post("/scrape", auth, controller.startScrape);
router.get("/jobs", auth, controller.getJobs);
router.get("/jobs/:id", auth, controller.getJob);
router.delete("/jobs/:id", auth, controller.cancelJob);

// Sectores y grupos
router.get("/sectors", auth, controller.getSectors);
router.post("/sectors", auth, controller.addSector);
router.put("/sectors/:id", auth, controller.editSector);
router.delete("/sectors/:id", auth, controller.removeSector);
router.post("/sectors/:id/urls", auth, controller.addGroupUrl);
router.post("/sectors/:id/urls/remove", auth, controller.removeGroupUrl);

// Ajustes y diagnóstico
router.get("/settings", auth, controller.getSettings);
router.put("/settings", auth, controller.saveSettings);
router.get("/health", auth, controller.health);

module.exports = router;
