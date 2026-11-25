/**
 * Cliente mínimo para la API REST de Apify.
 * Sin SDK: en la Raspberry Pi conviene no cargar dependencias extra y
 * el actor de grupos de Facebook corre en la nube de Apify, no en el equipo.
 */

const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR_ID = "apify/facebook-groups-scraper";

const actorPath = (actorId = ACTOR_ID) => actorId.replace("/", "~");

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(options.timeout || 45000),
  });

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const apiMessage = data?.error?.message || data?.message || raw.slice(0, 300);
    const friendly =
      response.status === 401
        ? "El token de Apify no es válido o fue revocado."
        : response.status === 402
          ? "La cuenta de Apify no tiene saldo o créditos disponibles."
          : `Apify respondió ${response.status}: ${apiMessage || "error desconocido"}`;
    const error = new Error(friendly);
    error.status = response.status;
    error.details = apiMessage;
    throw error;
  }

  return data;
};

/**
 * Normaliza IDs numéricos o fragmentos de URL en enlaces canónicos de grupos.
 */
function normalizeFacebookGroupUrl(rawUrl) {
  let url = String(rawUrl || "").trim();
  if (!url) return "";

  if (/^\d+$/.test(url)) return `https://www.facebook.com/groups/${url}/`;
  if (url.startsWith("groups/")) return `https://www.facebook.com/${url.replace(/\/+$/, "")}/`;
  if (!url.startsWith("http")) return `https://www.facebook.com/groups/${url.replace(/^\/+/, "")}/`;
  if (!url.endsWith("/")) url += "/";
  return url;
}

const cleanUrls = (urls = []) =>
  [...new Set(urls.map(normalizeFacebookGroupUrl).filter(Boolean))];

async function startRun(token, { urls, resultsLimit = 40, actorId = ACTOR_ID }) {
  if (!token) throw new Error("Falta configurar el token de Apify.");

  const startUrls = cleanUrls(urls).map((url) => ({ url }));
  if (!startUrls.length) throw new Error("Debes indicar al menos un grupo de Facebook válido.");

  const payload = {
    startUrls,
    resultsLimit: Math.max(1, Math.min(Number(resultsLimit) || 40, 500)),
  };

  const result = await request(
    `${APIFY_BASE}/acts/${actorPath(actorId)}/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!result?.data?.id) throw new Error("Apify no devolvió un identificador de ejecución.");
  return result.data;
}

async function getRun(token, runId) {
  if (!token) throw new Error("Falta configurar el token de Apify.");
  const result = await request(`${APIFY_BASE}/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
  return result?.data || null;
}

async function getDatasetItems(token, datasetId, { limit = 1000, offset = 0 } = {}) {
  if (!token) throw new Error("Falta configurar el token de Apify.");
  const url =
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}` +
    `&clean=true&format=json&limit=${limit}&offset=${offset}`;
  const items = await request(url, { timeout: 90000 });
  return Array.isArray(items) ? items : [];
}

async function getAccount(token) {
  if (!token) throw new Error("Falta configurar el token de Apify.");
  const result = await request(`${APIFY_BASE}/users/me?token=${encodeURIComponent(token)}`, { timeout: 20000 });
  return result?.data || null;
}

async function abortRun(token, runId) {
  if (!token || !runId) return null;
  try {
    const result = await request(`${APIFY_BASE}/actor-runs/${runId}/abort?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
    return result?.data || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  ACTOR_ID,
  normalizeFacebookGroupUrl,
  cleanUrls,
  startRun,
  getRun,
  getDatasetItems,
  getAccount,
  abortRun,
};
