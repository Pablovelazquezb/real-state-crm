// Catálogos visuales del módulo Prospector FB

export const SECTION_TABS = [
  { value: "all", label: "Todos" },
  { value: "renta", label: "Oferta" },
  { value: "demanda", label: "Demanda" },
  { value: "roomies", label: "Roomies" },
];

export const SECTIONS = {
  renta: { label: "Oferta", scheme: "green", description: "Propiedades y cuartos ofrecidos por dueños o brokers (renta y venta)" },
  demanda: { label: "Busca", scheme: "blue", description: "Clientes buscando rentar o comprar" },
  roomies: { label: "Roomie", scheme: "purple", description: "Personas buscando o compartiendo roomie" },
  otro: { label: "Otro", scheme: "gray", description: "Publicaciones sin clasificación" },
};

export const ROLE_SHORT = {
  supply_rent: { label: "Ofrece renta", scheme: "green" },
  supply_buy: { label: "Ofrece venta", scheme: "teal" },
  demand_rent: { label: "Busca rentar", scheme: "blue" },
  demand_buy: { label: "Busca comprar", scheme: "cyan" },
  roomie_supply: { label: "Ofrece cuarto", scheme: "purple" },
  roomie_demand: { label: "Busca cuarto", scheme: "pink" },
  spam: { label: "Descartado", scheme: "gray" },
};

export const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo", scheme: "blue" },
  { value: "contactado", label: "Contactado", scheme: "orange" },
  { value: "favorito", label: "Favorito", scheme: "yellow" },
  { value: "descartado", label: "Descartado", scheme: "gray" },
  { value: "convertido", label: "En CRM", scheme: "green" },
];

export const POSTER_OPTIONS = [
  { value: "all", label: "Cualquier publicador" },
  { value: "broker", label: "Brokers / Inmobiliarias" },
  { value: "directo", label: "Trato directo" },
  { value: "particular", label: "Particulares" },
];

export const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "score", label: "Mejor calificados" },
  { value: "priceDesc", label: "Precio mayor" },
  { value: "priceAsc", label: "Precio menor" },
];

export const JOB_STATUS = {
  queued: { label: "En cola", scheme: "gray" },
  running: { label: "En proceso", scheme: "blue" },
  succeeded: { label: "Completada", scheme: "green" },
  failed: { label: "Con error", scheme: "red" },
  cancelled: { label: "Cancelada", scheme: "orange" },
};

export const DEFAULT_FILTERS = {
  section: "all",
  zone: "all",
  status: "all",
  posterType: "all",
  search: "",
  sort: "recent",
  hotOnly: false,
  phoneOnly: false,
  mine: false,
};

export const PAGE_SIZE = 12;

export const statusOf = (value) =>
  STATUS_OPTIONS.find((status) => status.value === value) || STATUS_OPTIONS[0];

export const roleOf = (value) => ROLE_SHORT[value] || { label: "Prospecto", scheme: "gray" };

export const sectionOf = (value) => SECTIONS[value] || SECTIONS.otro;

export const scoreScheme = (score) => {
  if (score >= 85) return "green";
  if (score >= 70) return "yellow";
  if (score >= 50) return "orange";
  return "gray";
};

export const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "Hace un momento";
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffMinutes < 1440) return `Hace ${Math.round(diffMinutes / 60)} h`;

  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const groupUrlSlug = (url) => {
  const clean = String(url || "").replace(/\/+$/, "");
  return clean.split("/").pop() || clean;
};
