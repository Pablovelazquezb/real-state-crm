const express = require("express");
const { createInquiry } = require("./publicInquiry");
const { listProperties, viewProperty } = require("./publicProperties");

const router = express.Router();

// Endpoints abiertos (sin token) usados por el portal público de clientes.
router.post("/inquiry", createInquiry);
router.get("/properties", listProperties);
router.get("/properties/:id", viewProperty);

module.exports = router;
