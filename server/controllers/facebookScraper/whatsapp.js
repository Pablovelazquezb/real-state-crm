/**
 * Generación de mensajes de WhatsApp para prospección.
 * Port de whatsapp_bot_handler.py (solo la parte de copy, sin QR ni sesión).
 */

const cleanPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `521${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return `521${digits.slice(2)}`;
  if (digits.length >= 10) return digits;
  return null;
};

function buildWhatsAppUrl(phone, message) {
  const target = cleanPhone(phone);
  const text = encodeURIComponent(message || "");
  return target ? `https://wa.me/${target}?text=${text}` : `https://wa.me/?text=${text}`;
}

const firstNameOf = (lead) => {
  const name = String(lead.userName || "").trim();
  if (!name || name === "Contacto Facebook") return "Hola";
  return name.split(/\s+/)[0];
};

/**
 * Mensaje personalizado según rol del prospecto y tipo de publicador.
 */
function buildGreeting(lead) {
  const role = lead.role || "supply_rent";
  const firstName = firstNameOf(lead);
  const zone = lead.zone || "la zona";
  const price = lead.price ? `de aprox. ${lead.priceDisplay || ""}` : "";
  const propertyType = String(lead.propertyType || "propiedad").toLowerCase();

  const blob = `${lead.userName || ""} ${lead.text || ""}`.toLowerCase();
  const looksLikeBroker =
    lead.posterType === "broker" ||
    ["inmobiliaria", "bienes raíces", "bienes raices", "realty", "asesor", "asesora"].some((word) => blob.includes(word));

  if (role === "roomie_demand") {
    return `¡Hola ${firstName}! Vi que estás buscando roomie / cuarto compartido en ${zone} ${price}. Tengo perfiles compatibles de estudiantes y profesionistas con depa disponible en esa zona. ¿Te gustaría que te comparta opciones para coordinar una llamada?`;
  }

  if (role === "roomie_supply" || role === "roomie") {
    return `¡Hola ${firstName}! Vi tu publicación sobre el cuarto disponible para roomie en ${zone} ${price}. Tengo una persona compatible buscando integrarse como roomie en esa zona este mes. ¿Sigue disponible para compartirle los datos y ponerlos en contacto?`;
  }

  if (role === "demand_rent" || role === "demand_buy") {
    const action = role === "demand_rent" ? "rentar" : "comprar";
    return `¡Hola ${firstName}! Vi tu publicación donde buscas ${action} ${propertyType} en ${zone} ${price}. Cuento con opciones verificadas en esa zona que encajan con tu presupuesto y requisitos. ¿Te comparto fichas y fotos por aquí para que las revises?`;
  }

  if (role === "supply_rent" || role === "supply_buy") {
    if (looksLikeBroker) {
      return `¡Hola ${firstName}! Vi tu publicación de ${propertyType} en ${zone} ${price}. Soy asesor inmobiliario y tengo clientes calificados buscando activamente en esa zona. ¿Manejas comisión compartida? Me gustaría coordinar visita con mis clientes esta semana.`;
    }
    return `¡Hola ${firstName}! Vi tu anuncio sobre el ${propertyType} en ${zone} ${price}. Cuento con clientes calificados con fianza buscando mudarse pronto en esa zona. ¿Sigue disponible para presentárselo y agendarles visita?`;
  }

  return `¡Hola ${firstName}! Vi tu publicación inmobiliaria en Facebook sobre ${zone}. Me gustaría ponerme en contacto contigo para coordinar opciones disponibles. ¿Podemos platicar?`;
}

function buildMatchPitch(demandLead, supplyLead) {
  const demandName = firstNameOf(demandLead);
  const zone = supplyLead.zone || "la zona";
  const price = supplyLead.priceDisplay || "";
  const propertyType = String(supplyLead.propertyType || "departamento").toLowerCase();
  return `¡Hola ${demandName}! Encontré una opción justo a tu medida: ${propertyType} en ${zone} por ${price}. Cumple con tu presupuesto y ubicación buscada. ¿Te gustaría agendar una visita esta semana?`;
}

function buildRoomieMatchPitch(roomie1, roomie2) {
  const name1 = firstNameOf(roomie1);
  const name2 = firstNameOf(roomie2);
  const zone = roomie1.zone || roomie2.zone || "la zona";
  const price = roomie2.priceDisplay || roomie1.priceDisplay || "";
  return `¡Hola ${name1}! Encontré a ${name2}, quien también está buscando roomie en ${zone} con presupuesto de ${price}. Tienen un perfil compatible y misma zona. ¿Te parece bien si los pongo en contacto para que platiquen?`;
}

const buildContactMessage = (lead) => {
  const message = buildGreeting(lead);
  return { message, whatsappUrl: buildWhatsAppUrl(lead.phone, message) };
};

module.exports = {
  cleanPhone,
  buildWhatsAppUrl,
  buildGreeting,
  buildMatchPitch,
  buildRoomieMatchPitch,
  buildContactMessage,
};
