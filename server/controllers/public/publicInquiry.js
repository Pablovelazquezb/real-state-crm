const supabase = require("../../db/supabaseClient");

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

/**
 * Captación pública de prospectos desde el portal de clientes.
 * No requiere autenticación, pero valida los datos y limita el tamaño del texto.
 */
const createInquiry = async (req, res) => {
  try {
    const {
      leadName,
      name,
      leadEmail,
      email,
      leadPhoneNumber,
      phone,
      notes,
      message,
      propertyName,
    } = req.body || {};

    const fullName = String(leadName || name || "").trim().slice(0, 120);
    const emailValue = String(leadEmail || email || "").trim().slice(0, 160);
    const phoneValue = String(leadPhoneNumber || phone || "").trim().slice(0, 40);
    const comments = String(notes || message || "").trim().slice(0, 2000);

    if (fullName.length < 3) {
      return res.status(400).json({ message: "Escribe tu nombre completo." });
    }
    if (!phoneValue && !isEmail(emailValue)) {
      return res.status(400).json({ message: "Necesitamos un teléfono o un correo válido para contactarte." });
    }

    const payload = {
      lead_name: fullName,
      lead_email: isEmail(emailValue) ? emailValue : null,
      lead_phone_number: phoneValue || null,
      lead_address: null,
      lead_status: "New",
      lead_source: "Portal de clientes",
      lead_owner: null,
      notes: [propertyName ? `Propiedad de interés: ${propertyName}` : null, comments || null]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000) || null,
    };

    const { data, error } = await supabase.from("leads").insert([payload]).select("id").single();

    if (error) {
      console.error("[Portal] No se pudo registrar el prospecto:", error.message);
      return res.status(502).json({
        message: "No pudimos registrar tu solicitud en este momento. Intenta de nuevo o escríbenos por WhatsApp.",
      });
    }

    return res.status(201).json({
      message: "Solicitud registrada. Un asesor te contactará muy pronto.",
      leadId: data?.id || null,
    });
  } catch (error) {
    console.error("[Portal] Error inesperado:", error.message);
    return res.status(500).json({ message: "Ocurrió un error al enviar tu solicitud." });
  }
};

module.exports = { createInquiry };
