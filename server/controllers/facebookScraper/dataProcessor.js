/**
 * Procesador de publicaciones de Facebook.
 *
 * Port en Node de data_processor.py del proyecto original "facebook group scrapper".
 * Se mantiene la misma heurística (zonas de Monterrey, tipos de inmueble, roles,
 * scoring y cruces) para que el módulo del CRM clasifique igual que el scraper.
 */

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

const ZONES_MAP = {
  "San Pedro / Valle": [
    /\bsan pedro\b/, /\bspgg\b/, /\bvalle poniente\b/, /\bfuentes del valle\b/,
    /\bdel valle\b/, /\bvalle oriente\b/, /\bchipinque\b/, /\bcolorines\b/,
  ],
  "Zona Tec / Distrito Tec": [
    /\btec\b/, /\bdistrito tec\b/, /\bnuevo sur\b/, /\bvillas tec\b/,
    /\bcolonia florida\b/, /\bgarza sada\b/, /\balfonso reyes\b/, /\btorres tec\b/,
  ],
  "Zona UDEM / Santa Catarina": [
    /\budem\b/, /\bsanta catarina\b/, /\bvalle poniente udem\b/, /\bcordillera\b/,
  ],
  "Cumbres / San Jerónimo": [
    /\bcumbres\b/, /\bsan jer[oó]nimo\b/, /\bmitras\b/, /\bchepevera\b/,
    /\bleones\b/, /\bpuerta de hierro\b/,
  ],
  "Contry / Zona Sur": [
    /\bcontry\b/, /\bprimavera\b/, /\bzona sur\b/, /\bloma larga\b/,
    /\bmicropolis\b/, /\bsenda\b/,
  ],
  "Carretera Nacional": [
    /\bcarretera nacional\b/, /\bel uro\b/, /\blos cristales\b/,
    /\blares\b/, /\bsantiago\b/, /\blirios\b/,
  ],
  "Monterrey Centro / Obispado": [
    /\bcentro\b/, /\bobispado\b/, /\bbarrio antiguo\b/, /\bvenustiano carranza\b/,
  ],
};

const PROPERTY_TYPES = {
  Departamento: [/\bdepa\b/, /\bdepartamento\b/, /\bdepto\b/, /\btorre\b/, /\bpenthouse\b/],
  Casa: [/\bcasa\b/, /\bresidencia\b/, /\bfraccionamiento\b/, /\bprivada\b/],
  Loft: [/\bloft\b/, /\bestudio\b/, /\bsuite\b/],
  "Habitación / Cuarto": [/\bcuarto\b/, /\bhabitaci[oó]n\b/, /\brec[aá]mara\b/],
  "Terreno / Lote": [/\bterreno\b/, /\blote\b/, /\bcampestre\b/, /\bquinta\b/],
  "Local / Oficina": [/\blocal\b/, /\boficina\b/, /\bbodega\b/, /\bconsultorio\b/],
};

const ROLE_LABELS = {
  supply_rent: "Arrendador (Ofrece Renta)",
  supply_buy: "Vendedor (Ofrece Venta)",
  demand_rent: "Inquilino (Busca Rentar)",
  demand_buy: "Comprador (Busca Comprar)",
  roomie_supply: "Roomie (Ofrece Cuarto en Depa)",
  roomie_demand: "Roomie (Busca Cuarto / Compañero)",
  spam: "No Relevante / Spam",
};

const SECTION_BY_ROLE = (role) => {
  if (role.startsWith("roomie")) return "roomies";
  if (role.startsWith("demand")) return "demanda";
  if (role.startsWith("supply")) return "renta";
  return "otro";
};

const ZONES = Object.keys(ZONES_MAP);
const DEFAULT_ZONE = "Zona Metropolitana";

// ---------------------------------------------------------------------------
// Extracción de datos
// ---------------------------------------------------------------------------

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

function extractPhone(text) {
  if (!text) return null;

  const patterns = [
    /(?:\+?52\s*)?(?:1\s*)?(?:81|55|33|\d{2})[\s.-]*\d{4}[\s.-]*\d{4}/,
    /\b\d{10}\b/,
    /(?:whats(?:app)?|tel|cel|telefono|teléfono|celular)\s*:?\s*([\d\s.-]{8,15})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const digits = onlyDigits(match[0]);
    if (digits.length === 10) {
      return `+52 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
    if (digits.length === 12 && digits.startsWith("52")) {
      return `+52 ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
    }
  }
  return null;
}

function extractPrice(text) {
  if (!text) return null;

  // Millones: "3.5 millones", "3.5 mdp"
  const millions = text.match(/(\d+(?:[.,]\d+)?)\s*(?:millones|mdp|mill[oó]n)\b/i);
  if (millions) {
    return Math.round(parseFloat(millions[1].replace(",", ".")) * 1000000);
  }

  // Abreviación "15k"
  const thousands = text.match(/\b(\d{1,3})\s*k\b/i);
  if (thousands) {
    const value = parseInt(thousands[1], 10) * 1000;
    if (value >= 2000 && value <= 200000) return value;
  }

  const patterns = [
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{4,8})\b/,
    /\b(?:renta|precio|costo|cuota|presupuesto|mensualidad)(?:\s+(?:es|de|en|es\s+de))?\s*[:=]?\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d{3,8})\b/i,
    /\b(\d{1,3}(?:,\d{3})+|\d{4,8})\s*(?:mxn|pesos|mensuales)\b/i,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))];
    for (const match of matches) {
      const value = Number(String(match[1]).replace(/[,.]/g, ""));
      if (!Number.isFinite(value)) continue;
      const isYear = [2023, 2024, 2025, 2026, 2027, 2028].includes(value);
      if (value >= 1500 && value <= 80000000 && !isYear) return value;
    }
  }

  return null;
}

function detectPosterType(text, userName = "") {
  const combined = `${text} ${userName}`.toLowerCase();

  const directTerms = [
    "trato directo", "sin intermediarios", "soy el dueño", "soy dueño", "soy dueña",
    "soy la dueña", "propietario directo", "directo con el dueño", "sin comisión",
  ];
  if (directTerms.some((term) => combined.includes(term))) return "directo";

  const brokerTerms = [
    "inmobiliaria", "bienes raíces", "bienes raices", "realty", "premier", "asesor",
    "asesora", "propiedades", "homes", "inmuebles", "consultor", "agencia", "broker",
    "grupo inmobiliario", "comparto comision", "comparto comisión", "comisión 50",
    "asesores bienvenidos", "trato con asesores", "alianza inmobiliaria",
  ];
  if (brokerTerms.some((term) => combined.includes(term))) return "broker";

  return "particular";
}

function detectRoomiePreferences(text) {
  const tl = (text || "").toLowerCase();

  let gender = "Indistinto / Mixto";
  if (["mujer", "mujeres", "chica", "chicas", "señorita", "solo mujeres", "solo chicas", "estudiante mujer"].some((w) => tl.includes(w))) {
    gender = "Solo Mujeres";
  } else if (["hombre", "hombres", "chico", "chicos", "varón", "solo hombres", "solo chicos", "estudiante hombre"].some((w) => tl.includes(w))) {
    gender = "Solo Hombres";
  }

  let profile = "Profesionista / General";
  if (["estudiante", "estudiantes", "tec", "udem", "facultad", "foráneo", "foráneos", "universitario"].some((w) => tl.includes(w))) {
    profile = "Estudiantes / Foráneos";
  }

  let pets = "Consultar";
  const noPets = ["no mascotas", "sin mascotas", "no se aceptan mascotas"].some((w) => tl.includes(w));
  const yesPets = ["pet friendly", "se aceptan mascotas", "acepta mascota", "mascota"].some((w) => tl.includes(w));
  if (noPets) pets = "No Mascotas";
  else if (yesPets) pets = "Pet Friendly";

  let services = "No especificado";
  if (["servicios incluidos", "incluye servicios", "agua e internet", "luz e internet", "incluye internet", "incluye agua"].some((w) => tl.includes(w))) {
    services = "Servicios Incluidos";
  }

  return { gender, profile, pets, services };
}

function detectZone(text, fallback = DEFAULT_ZONE) {
  if (!text) return fallback;
  const tl = text.toLowerCase();
  for (const zoneName of ZONES) {
    if (ZONES_MAP[zoneName].some((pattern) => pattern.test(tl))) return zoneName;
  }
  return fallback;
}

function detectPropertyType(text) {
  if (!text) return "Inmueble";
  const tl = text.toLowerCase();
  for (const [type, patterns] of Object.entries(PROPERTY_TYPES)) {
    if (patterns.some((pattern) => pattern.test(tl))) return type;
  }
  return "Inmueble";
}

function detectUrgency(text) {
  if (!text) return "Normal";
  const tl = text.toLowerCase();
  // Se usan límites de palabra para evitar falsos positivos (p. ej. "playa" contiene "ya").
  const urgent = [/\burgente\b/, /\bde inmediato\b/, /\beste mes\b/, /\besta semana\b/, /\bpara entrar\b/, /\blisto para mudarse\b/];
  if (urgent.some((pattern) => pattern.test(tl))) return "Alta 🔥";
  return "Normal";
}

function classifyRole(text) {
  if (!text || text.trim().length < 10) return { role: "spam", roleLabel: "Sin Contenido / Vacío" };

  const tl = text.toLowerCase();

  // 1. Servicios ajenos al giro inmobiliario
  const spamKeywords = [
    "paciente", "extraccion", "extracciones", "muelas", "dentista", "odontolog",
    "servicio de limpieza", "limpieza fina", "uñas", "pestañas", "fletes y mudanzas",
    "prestamo", "préstamo", "empeño", "taller mecanico", "venta de auto", "ropa y calzado",
    "dental", "odontolog", "ortodoncia", "blanqueamiento", "implante", "caries", "muelas",
    "nutriolog", "psicolog", "masaje", "barberia", "barbería", "tatuaje",
  ];
  if (spamKeywords.some((keyword) => tl.includes(keyword))) {
    return { role: "spam", roleLabel: "No Relevante / Servicio" };
  }

  // 2. Roomies (prioridad alta)
  const roomieKeywords = [
    "roomie", "roomies", "roommate", "roommates", "rumi", "rumies", "coliving", "co-living",
    "compartir departamento", "compartir depa", "compartir casa", "compartir cuarto",
    "cuarto compartido", "habitacion compartida", "habitación compartida", "recamara compartida",
    "recámara compartida", "busca roomie", "busco roomie", "se busca roomie", "buscamos roomie",
    "busco roommate", "se busca roommate", "renta de cuarto", "rento cuarto", "rento recamara",
    "rento recámara", "rento habitacion", "rento habitación",
  ];
  if (roomieKeywords.some((keyword) => tl.includes(keyword))) {
    const demands = [
      "busco roomie", "busco cuarto", "busco habitacion", "busco habitación", "busco recamara",
      "busco recámara", "busco compartir", "busco roommate",
    ];
    if (demands.some((keyword) => tl.includes(keyword))) {
      return { role: "roomie_demand", roleLabel: ROLE_LABELS.roomie_demand };
    }
    return { role: "roomie_supply", roleLabel: ROLE_LABELS.roomie_supply };
  }

  // 3. Demanda
  const demandKeywords = [
    "busco", "buscamos", "necesito", "necesitamos", "solicito", "solicitamos",
    "alguien que rente", "alguien que venda", "interesado en", "me interesa rentar",
    "me interesa comprar", "cuento con presupuesto", "presupuesto hasta", "busco depa",
    "busco casa", "busco terreno", "compro casa", "compro terreno",
  ];
  const isDemand = demandKeywords.some((keyword) => tl.includes(keyword));

  // 4. Venta
  const saleKeywords = [
    "venta", "en venta", "se vende", "vendo", "terreno en venta", "casa en venta",
    "departamento en venta", "remate", "preventa", "escritura", "crédito bancario",
    "credito bancario", "infonavit", "plusvalía", "plusvalia", "traspaso",
  ];
  const isSale = saleKeywords.some((keyword) => tl.includes(keyword));

  if (isDemand && isSale) return { role: "demand_buy", roleLabel: ROLE_LABELS.demand_buy };
  if (isDemand) return { role: "demand_rent", roleLabel: ROLE_LABELS.demand_rent };
  if (isSale) return { role: "supply_buy", roleLabel: ROLE_LABELS.supply_buy };
  return { role: "supply_rent", roleLabel: ROLE_LABELS.supply_rent };
}

function calculateLeadScore({ role, phone, price, zone, urgency }) {
  if (role === "spam") return 0;

  let score = 40; // Publicación legítima
  if (phone) score += 30;
  if (price) score += 15;
  if (zone && zone !== DEFAULT_ZONE) score += 10;
  if (String(urgency || "").includes("Alta")) score += 10;
  if (["demand_rent", "demand_buy"].includes(role)) score += 5;

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Normalización
// ---------------------------------------------------------------------------

const pickText = (item) =>
  String(item.text || item.message || item.postText || item["Texto Publicación"] || item.caption || "").trim();

const pickUserName = (item) => {
  const candidate =
    item.userName ||
    (item.user && (item.user.name || item.user.fullName)) ||
    item.username ||
    item.user_name ||
    item["Usuario"] ||
    "";
  return String(candidate).trim() || "Contacto Facebook";
};

const pickGroupName = (item) => {
  const candidate =
    item.groupName ||
    (item.group && (item.group.name || item.group.title)) ||
    item.group_name ||
    item["Grupo"] ||
    item.groupTitle ||
    "";
  return String(candidate).trim() || "Comunidad Inmobiliaria";
};

// En el actor de grupos, `url` es el permalink del post y `facebookUrl` el grupo.
const pickUrl = (item) =>
  item.url || item.postUrl || item.link || item.permalink || item["URL Facebook"] || item.facebookUrl || item.facebook_url || "";

const pickGroupUrl = (item) => item.facebookUrl || item.groupUrl || item.group_url || "";

const pickPostId = (item) => {
  const direct = item.postId || item.post_id || item.id || item.facebookId;
  if (direct) return String(direct);
  const url = pickUrl(item);
  const fromUrl = url.match(/permalink\/(\d+)/) || url.match(/posts\/(\d+)/) || url.match(/\/p\/([^/?]+)/);
  if (fromUrl) return fromUrl[1];
  return null;
};

const pickDate = (item) => {
  const raw = item.time || item.date || item.createdAt || item.timestamp || item["Fecha"] || item.dateStr;
  if (!raw) return { postedAt: null, dateStr: "Reciente" };
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return { postedAt: null, dateStr: String(raw) };
  return { postedAt: date, dateStr: String(raw) };
};

/**
 * Normaliza y clasifica una publicación cruda del dataset de Apify.
 * @param {object} rawItem
 * @param {{ sectorName?: string, sectorId?: string, ownerId?: string, ownerName?: string }} context
 */
function normalizeAndClassifyLead(rawItem, context = {}) {
  const text = pickText(rawItem);
  const { role, roleLabel } = classifyRole(text);
  const phone = extractPhone(text) || rawItem.phone || rawItem.ai_phone || null;
  const price = extractPrice(text) || (Number(rawItem.price) || null);
  const zone = detectZone(text, rawItem.sector || context.sectorName || DEFAULT_ZONE);
  const propertyType = detectPropertyType(text);
  const urgency = detectUrgency(text);
  const leadScore = calculateLeadScore({ role, phone, price, zone, urgency });
  const posterType = detectPosterType(text, pickUserName(rawItem));
  const roomiePrefs = detectRoomiePreferences(text);
  const section = SECTION_BY_ROLE(role);
  const { postedAt, dateStr } = pickDate(rawItem);

  const priceDisplay = price
    ? role === "supply_buy" || role === "demand_buy"
      ? `$${Math.round(price).toLocaleString("es-MX")} MXN`
      : `$${Math.round(price).toLocaleString("es-MX")} MXN / mes`
    : "A convenir / Por consultar";

  const cleanText = text.replace(/\s+/g, " ").trim();
  const fallbackSummary = cleanText.length > 130 ? `${cleanText.slice(0, 130)}...` : cleanText || "Publicación inmobiliaria";

  return {
    postId: pickPostId(rawItem) || `fb_${hashString(cleanText + pickUserName(rawItem))}`,
    url: pickUrl(rawItem) || pickGroupUrl(rawItem) || "https://www.facebook.com",
    groupUrl: pickGroupUrl(rawItem) || null,
    text,
    userName: pickUserName(rawItem),
    groupName: pickGroupName(rawItem),
    sectorId: context.sectorId || null,
    sectorName: context.sectorName || null,
    role,
    roleLabel,
    section,
    posterType,
    roomiePrefs,
    propertyType,
    zone,
    price: price || null,
    priceDisplay,
    phone: phone || null,
    urgency,
    leadScore,
    aiSummary: rawItem.ai_summary || rawItem.aiSummary || fallbackSummary,
    status: rawItem.status || "nuevo",
    dateStr,
    postedAt,
    ownerId: context.ownerId || null,
    ownerName: context.ownerName || null,
    source: "facebook",
  };
}

function hashString(value) {
  const str = String(value || "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000000007;
  }
  return hash.toString(36);
}

// ---------------------------------------------------------------------------
// Cruces inteligentes (smart matchmaking)
// ---------------------------------------------------------------------------

const sectionOf = (lead) => lead.section || SECTION_BY_ROLE(lead.role || "");

const COUNTER_ROLES = {
  roomie_demand: ["roomie_supply", "roomie", "supply_rent"],
  roomie_supply: ["roomie_demand", "roomie", "demand_rent"],
  demand_rent: ["supply_rent"],
  demand_buy: ["supply_buy"],
  supply_rent: ["demand_rent"],
  supply_buy: ["demand_buy"],
};

function findSmartMatches(targetLead, allLeads) {
  const targetRole = targetLead.role || "";
  const targetSection = sectionOf(targetLead);
  const counterRoles = COUNTER_ROLES[targetRole];
  if (!counterRoles) return [];

  const targetZone = String(targetLead.zone || "").toLowerCase();
  const targetPrice = Number(targetLead.price) || null;
  const targetPrefs = targetLead.roomiePrefs || {};
  const matches = [];

  for (const candidate of allLeads) {
    if (candidate.postId === targetLead.postId) continue;
    if (!counterRoles.includes(candidate.role)) continue;

    let compatScore = 50;
    const reasons = [];

    const candidateZone = String(candidate.zone || "").toLowerCase();
    if (targetZone !== "zona metropolitana" && targetSection !== "otro") {
      if (candidateZone === targetZone) {
        compatScore += 25;
        reasons.push(`Misma zona (${candidate.zone})`);
      } else if (candidateZone !== "zona metropolitana") {
        continue;
      }
    }

    const candidatePrice = Number(candidate.price) || null;
    if (targetPrice && candidatePrice) {
      if (targetRole.startsWith("demand") || targetRole === "roomie_demand") {
        if (candidatePrice <= targetPrice * 1.15) {
          compatScore += 20;
          reasons.push(`Dentro de presupuesto (${formatMoney(candidatePrice)} vs ${formatMoney(targetPrice)})`);
        }
      } else if (candidatePrice <= targetPrice * 1.15) {
        compatScore += 20;
        reasons.push("Presupuesto compatible");
      }
    }

    if (targetSection === "roomies" || targetRole.startsWith("roomie")) {
      const candidatePrefs = candidate.roomiePrefs || {};
      const targetGender = targetPrefs.gender || "Indistinto / Mixto";
      const candidateGender = candidatePrefs.gender || "Indistinto / Mixto";

      if (targetGender === candidateGender && targetGender !== "Indistinto / Mixto") {
        compatScore += 15;
        reasons.push(`Filtro de género compatible (${targetGender})`);
      } else if (targetGender.includes("Solo") && candidateGender.includes("Solo") && targetGender !== candidateGender) {
        continue;
      }

      if (targetPrefs.pets === "Pet Friendly" && candidatePrefs.pets === "Pet Friendly") {
        compatScore += 10;
        reasons.push("Ambos Pet Friendly");
      }
    }

    if (compatScore >= 55) {
      matches.push({ lead: candidate, score: Math.min(compatScore, 99), reasons });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}

function getAllCrossMatches(allLeads) {
  const demandLeads = allLeads.filter(
    (lead) => ["demanda", "roomies"].includes(sectionOf(lead)) || String(lead.role || "").startsWith("demand") || lead.role === "roomie_demand",
  );

  const pairs = [];
  const seen = new Set();

  for (const demandLead of demandLeads) {
    const found = findSmartMatches(demandLead, allLeads);
    for (const match of found) {
      const key = [demandLead.postId, match.lead.postId].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);

      const isRoomie =
        sectionOf(demandLead) === "roomies" ||
        sectionOf(match.lead) === "roomies" ||
        String(demandLead.role || "").startsWith("roomie") ||
        String(match.lead.role || "").startsWith("roomie");

      pairs.push({ demand: demandLead, supply: match.lead, score: match.score, reasons: match.reasons, isRoomie });
    }
  }

  return pairs.sort((a, b) => b.score - a.score).slice(0, 80);
}

// ---------------------------------------------------------------------------
// Filtros en memoria (usados por exportaciones y cruces)
// ---------------------------------------------------------------------------

function formatMoney(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString("es-MX")} MXN`;
}

function filterLeads(leads, filters = {}) {
  const {
    section,
    role,
    zone,
    posterType,
    status,
    search,
    minPrice,
    maxPrice,
    hotOnly,
    phoneOnly,
  } = filters;

  const query = String(search || "").trim().toLowerCase();

  return leads.filter((lead) => {
    if (lead.role === "spam" && !status) return false;

    if (section && section !== "all" && sectionOf(lead) !== section) return false;
    if (posterType && posterType !== "all" && (lead.posterType || "particular") !== posterType) return false;
    if (role && role !== "all" && lead.role !== role) return false;
    if (zone && zone !== "all" && lead.zone !== zone) return false;
    if (status && status !== "all" && (lead.status || "nuevo") !== status) return false;
    if (hotOnly && (lead.leadScore || 0) < 75) return false;
    if (phoneOnly && !lead.phone) return false;

    const price = Number(lead.price) || null;
    if (minPrice !== undefined && minPrice !== null && price !== null && price < minPrice) return false;
    if (maxPrice !== undefined && maxPrice !== null && price !== null && price > maxPrice) return false;

    if (query) {
      const haystack = `${lead.text || ""} ${lead.userName || ""} ${lead.zone || ""} ${lead.groupName || ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

module.exports = {
  ZONES,
  ZONES_MAP,
  PROPERTY_TYPES,
  ROLE_LABELS,
  DEFAULT_ZONE,
  extractPhone,
  extractPrice,
  detectPosterType,
  detectRoomiePreferences,
  detectZone,
  detectPropertyType,
  detectUrgency,
  classifyRole,
  calculateLeadScore,
  normalizeAndClassifyLead,
  findSmartMatches,
  getAllCrossMatches,
  filterLeads,
  sectionOf,
  formatMoney,
};
