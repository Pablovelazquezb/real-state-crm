import { deleteApi, getApi, postApi, putApi } from "services/api";

const BASE = "api/facebook-scraper";

const cleanParams = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all" || value === false) return;
    query.append(key, value);
  });

  return query.toString();
};

/** Mensaje legible a partir de la respuesta de axios/backend. */
export const apiMessage = (error, fallback = "No se pudo completar la acción.") =>
  error?.response?.data?.message || error?.message || fallback;

export const api = {
  bootstrap: () => getApi(`${BASE}/bootstrap`),
  stats: () => getApi(`${BASE}/stats`),

  leads: (params) => getApi(`${BASE}/leads?${cleanParams(params)}`),
  lead: (id) => getApi(`${BASE}/leads/${id}`),
  updateStatus: (id, status) => putApi(`${BASE}/leads/${id}/status`, { status }),
  saveNotes: (id, notes) => putApi(`${BASE}/leads/${id}/notes`, { notes }),
  removeLead: (id) => deleteApi(`${BASE}/leads/`, id),
  convertLead: (id) => postApi(`${BASE}/leads/${id}/convert`),
  exportLeads: (format, filters) => postApi(`${BASE}/export`, { format, filters }),
  importSeed: () => postApi(`${BASE}/import-seed`),

  matches: (leadId) => getApi(`${BASE}/matches${leadId ? `?leadId=${leadId}` : ""}`),

  scrape: (payload) => postApi(`${BASE}/scrape`, payload),
  jobs: () => getApi(`${BASE}/jobs?limit=15`),
  job: (id) => getApi(`${BASE}/jobs/${id}`),
  cancelJob: (id) => deleteApi(`${BASE}/jobs/`, id),

  sectors: () => getApi(`${BASE}/sectors`),
  createSector: (payload) => postApi(`${BASE}/sectors`, payload),
  updateSector: (id, payload) => putApi(`${BASE}/sectors/${id}`, payload),
  removeSector: (id) => deleteApi(`${BASE}/sectors/`, id),
  addUrl: (id, url) => postApi(`${BASE}/sectors/${id}/urls`, { url }),
  removeUrl: (id, url) => postApi(`${BASE}/sectors/${id}/urls/remove`, { url }),

  settings: () => getApi(`${BASE}/settings`),
  saveSettings: (payload) => putApi(`${BASE}/settings`, payload),
  health: () => getApi(`${BASE}/health`),
};

/** Descarga un archivo de texto generado por el backend. */
export const downloadFile = ({ content, mime, filename }) => {
  const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "prospectos.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
