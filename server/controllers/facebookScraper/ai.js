/**
 * Enriquecimiento opcional con Google Gemini.
 * Si no hay llave configurada (o falla) el flujo de scraping continúa sin IA.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.5-flash";

const ROLE_WHITELIST = [
  "demand_rent",
  "supply_rent",
  "demand_buy",
  "supply_buy",
  "roomie",
  "spam",
];

function parseJsonBlock(text) {
  if (!text) return null;
  let raw = String(text).trim();

  if (raw.includes("```")) {
    const parts = raw.split("```");
    raw = parts[1] || parts[0];
    if (raw.trim().toLowerCase().startsWith("json")) raw = raw.trim().slice(4);
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch (error) {
    return null;
  }
}

/**
 * Analiza hasta 12 publicaciones por lote y agrega resumen ejecutivo,
 * rol corregido y teléfono faltante.
 * @param {Array<object>} leads
 * @param {string} apiKey
 * @returns {Promise<{ leads: Array<object>, applied: number, warning: string|null }>}
 */
async function enrichBatch(leads, apiKey) {
  if (!Array.isArray(leads) || leads.length === 0) return { leads, applied: 0, warning: null };
  if (!apiKey) return { leads, applied: 0, warning: "Sin llave de Gemini configurada." };

  const batch = leads.slice(0, 12);
  const numbered = batch
    .map((lead, index) => `[${index}] ${String(lead.text || "").slice(0, 250)}`)
    .join("\n");

  const prompt =
    "Eres un analista inmobiliario experto en Monterrey, México. Analiza estos anuncios de Facebook.\n" +
    "Devuelve EXCLUSIVAMENTE un JSON con esta forma:\n" +
    '{"0": {"resumen": "una oración ejecutiva", "rol": "demand_rent|supply_rent|demand_buy|supply_buy|roomie|spam", "telefono": "10 dígitos o null"}}\n' +
    "Reglas de rol:\n" +
    "- demand_rent: busca depa/casa/cuarto para rentar\n" +
    "- supply_rent: propietario o arrendador ofreciendo renta\n" +
    "- demand_buy: comprador buscando comprar\n" +
    "- supply_buy: vendedor ofreciendo venta\n" +
    "- roomie: busca o comparte roomie / cuarto compartido\n" +
    "- spam: servicios ajenos al giro inmobiliario\n\n" +
    "Anuncios:\n" +
    numbered;

  const response = await fetch(`${GEMINI_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const raw = await response.text();
    const message =
      response.status === 400 || response.status === 401 || response.status === 403
        ? "La llave de Gemini no es válida o no tiene permisos."
        : `Gemini respondió ${response.status}: ${raw.slice(0, 160)}`;
    return { leads, applied: 0, warning: message };
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n");
  const parsed = parseJsonBlock(text);
  if (!parsed) return { leads, applied: 0, warning: "Gemini devolvió una respuesta que no se pudo interpretar." };

  let applied = 0;

  for (const [key, value] of Object.entries(parsed)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= batch.length) continue;
    if (!value || typeof value !== "object") continue;

    const lead = batch[index];
    if (value.resumen) {
      lead.aiSummary = String(value.resumen).trim();
      applied += 1;
    }

    const phoneDigits = String(value.telefono || "").replace(/\D/g, "");
    if (phoneDigits.length === 10 && !lead.phone) {
      lead.phone = `+52 ${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2, 6)} ${phoneDigits.slice(6)}`;
      applied += 1;
    }

    const suggestedRole = String(value.rol || "").trim();
    if (ROLE_WHITELIST.includes(suggestedRole)) {
      if (suggestedRole === "spam") {
        lead.role = "spam";
        lead.roleLabel = "No Relevante / Spam";
        lead.section = "otro";
      } else if (suggestedRole === "roomie") {
        if (!String(lead.role).startsWith("roomie")) {
          lead.role = "roomie_supply";
          lead.roleLabel = "Roomie (Ofrece Cuarto en Depa)";
          lead.section = "roomies";
        }
      } else if (lead.role !== suggestedRole && !String(lead.role).startsWith("roomie")) {
        lead.role = suggestedRole;
        lead.section = suggestedRole.startsWith("demand") ? "demanda" : "renta";
        lead.roleLabel = suggestedRole;
      }
      applied += 1;
    }
  }

  return { leads, applied, warning: null };
}

async function checkHealth(apiKey) {
  if (!apiKey) return { ok: false, message: "Sin llave de Gemini" };
  try {
    const response = await fetch(`${GEMINI_BASE}/models?key=${encodeURIComponent(apiKey)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { ok: false, message: `Gemini ${response.status}` };
    return { ok: true, message: `Gemini conectado (${MODEL})` };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

module.exports = { enrichBatch, checkHealth, MODEL };
