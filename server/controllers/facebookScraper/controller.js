const User = require("../../model/schema/user");
const supabase = require("../../db/supabaseClient");
const { ZONES, PROPERTY_TYPES } = require("./dataProcessor");
const leadsStore = require("./leadsStore");
const sectors = require("./sectors");
const settingsService = require("./settings");
const scraper = require("./scraper");
const apify = require("./apify");
const ai = require("./ai");

const handleError = (res, error, fallbackMessage = "Ocurrió un error inesperado.") => {
  const status = Number(error?.status) || 400;
  console.error("[Prospector FB]", error?.message || error);
  return res.status(status).json({ message: error?.message || fallbackMessage });
};

/**
 * Datos del usuario autenticado (el token solo trae el id).
 */
async function getViewer(req) {
  const rawId = req?.user?.userId;
  const viewer = { id: rawId ? String(rawId) : null, name: "Empleado", role: null };

  if (rawId && /^[a-f\d]{24}$/i.test(String(rawId))) {
    try {
      const user = await User.findById(rawId).lean();
      if (user) {
        viewer.id = String(user._id);
        viewer.name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;
        viewer.role = user.role;
      }
    } catch (error) {
      // El usuario no existe en Mongo: se intenta con Supabase.
    }
  }

  // Usuarios del CRM que viven en Supabase (el token solo trae el uuid).
  if (rawId && !viewer.role) {
    try {
      const { data } = await supabase
        .from("users")
        .select("first_name, last_name, username, role")
        .eq("id", String(rawId))
        .limit(1);

      const dbUser = data?.[0];
      if (dbUser) {
        viewer.name = `${dbUser.first_name || ""} ${dbUser.last_name || ""}`.trim() || dbUser.username;
        viewer.role = dbUser.role || null;
      }
    } catch (error) {
      // Sin conexión a Supabase se mantiene el nombre genérico.
    }
  }

  return viewer;
}

const index = async (req, res) => {
  const viewer = await getViewer(req);
  return res.json({ message: "Prospector FB API", viewer });
};

/**
 * Carga inicial del módulo: métricas, sectores, ajustes y actividad.
 */
const bootstrap = async (req, res) => {
  try {
    const viewer = await getViewer(req);

    const [stats, sectorList, publicSettings, jobs] = await Promise.all([
      leadsStore.getStats(),
      sectors.listSectors(),
      settingsService.getPublicSettings(),
      scraper.listJobs(8),
    ]);

    return res.json({
      viewer,
      stats,
      sectors: sectorList,
      settings: publicSettings,
      jobs,
      zones: ZONES,
      propertyTypes: Object.keys(PROPERTY_TYPES),
      statuses: leadsStore.STATUSES,
    });
  } catch (error) {
    return handleError(res, error, "No se pudo cargar el módulo Prospector FB.");
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await leadsStore.getStats();
    return res.json(stats);
  } catch (error) {
    return handleError(res, error, "No se pudieron obtener las métricas.");
  }
};

const getLeads = async (req, res) => {
  try {
    const viewer = await getViewer(req);
    const { page, limit, sort, ...filters } = req.query;

    const result = await leadsStore.listLeads({
      filters,
      page,
      limit,
      sort,
      viewer,
    });

    return res.json({ ...result, viewer });
  } catch (error) {
    return handleError(res, error, "No se pudieron obtener los prospectos.");
  }
};

const getLead = async (req, res) => {
  try {
    const lead = await leadsStore.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Prospecto no encontrado." });
    return res.json(lead);
  } catch (error) {
    return handleError(res, error);
  }
};

const changeStatus = async (req, res) => {
  try {
    const lead = await leadsStore.updateLeadStatus(req.params.id, req.body.status);
    return res.json(lead);
  } catch (error) {
    return handleError(res, error);
  }
};

const saveNotes = async (req, res) => {
  try {
    const lead = await leadsStore.updateLeadNotes(req.params.id, req.body.notes);
    return res.json(lead);
  } catch (error) {
    return handleError(res, error);
  }
};

const removeLead = async (req, res) => {
  try {
    await leadsStore.deleteLead(req.params.id);
    return res.json({ message: "Prospecto eliminado." });
  } catch (error) {
    return handleError(res, error);
  }
};

const matches = async (req, res) => {
  try {
    const result = await leadsStore.getMatches({ leadId: req.query.leadId });
    return res.json(result);
  } catch (error) {
    return handleError(res, error, "No se pudieron calcular los cruces.");
  }
};

const convertLead = async (req, res) => {
  try {
    const viewer = await getViewer(req);
    const result = await leadsStore.convertToCrmLead(req.params.id, viewer);
    return res.json({
      ...result,
      message: result.alreadyConverted
        ? "Este prospecto ya estaba en el CRM."
        : "Prospecto enviado al módulo de Leads del CRM.",
    });
  } catch (error) {
    return handleError(res, error, "No se pudo enviar el prospecto al CRM.");
  }
};

const startScrape = async (req, res) => {
  try {
    const viewer = await getViewer(req);
    const { sectorId, urls = [], resultsLimit, aiEnrich } = req.body || {};

    let selectedUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];
    let sector = null;

    if (sectorId) {
      const resolved = await sectors.getUrlsForSector(sectorId);
      sector = resolved.sector;
      if (!selectedUrls.length) selectedUrls = resolved.urls;
    }

    if (!selectedUrls.length) {
      selectedUrls = await sectors.allConfiguredUrls();
    }

    if (!selectedUrls.length) {
      return res.status(400).json({
        message: "No hay grupos configurados. Agrega al menos una URL de grupo de Facebook en la pestaña Grupos.",
      });
    }

    const job = await scraper.createJob({
      urls: selectedUrls,
      sector,
      resultsLimit,
      aiEnrich,
      user: viewer,
    });

    return res.status(201).json({ job, message: "Extracción iniciada. Te avisaremos aquí mismo cuando termine." });
  } catch (error) {
    return handleError(res, error);
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await scraper.listJobs(req.query.limit);
    return res.json(jobs);
  } catch (error) {
    return handleError(res, error);
  }
};

const getJob = async (req, res) => {
  try {
    const job = await scraper.getJob(req.params.id);
    if (!job) return res.status(404).json({ message: "Extracción no encontrada." });
    return res.json(job);
  } catch (error) {
    return handleError(res, error);
  }
};

const cancelJob = async (req, res) => {
  try {
    const job = await scraper.cancelJob(req.params.id);
    return res.json(job);
  } catch (error) {
    return handleError(res, error);
  }
};

// ---------------------------------------------------------------------------
// Sectores y grupos
// ---------------------------------------------------------------------------

const getSectors = async (req, res) => {
  try {
    const list = await sectors.listSectors();
    const totalGroups = list.reduce((acc, sector) => acc + (sector.urls?.length || 0), 0);
    return res.json({ sectors: list, totalGroups });
  } catch (error) {
    return handleError(res, error);
  }
};

const addSector = async (req, res) => {
  try {
    const sector = await sectors.createSector(req.body || {});
    return res.status(201).json({ sector, message: "Sector creado." });
  } catch (error) {
    return handleError(res, error);
  }
};

const editSector = async (req, res) => {
  try {
    const sector = await sectors.updateSector(req.params.id, req.body || {});
    if (!sector) return res.status(404).json({ message: "Sector no encontrado." });
    return res.json({ sector, message: "Sector actualizado." });
  } catch (error) {
    return handleError(res, error);
  }
};

const removeSector = async (req, res) => {
  try {
    await sectors.deleteSector(req.params.id);
    return res.json({ message: "Sector eliminado." });
  } catch (error) {
    return handleError(res, error);
  }
};

const addGroupUrl = async (req, res) => {
  try {
    const { url } = req.body || {};
    const result = await sectors.addUrlToSector(req.params.id, url);
    return res.json({
      sector: result.sector,
      message: result.added ? "Grupo agregado." : "Ese grupo ya estaba registrado en el sector.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const removeGroupUrl = async (req, res) => {
  try {
    const { url } = req.body || {};
    const result = await sectors.removeUrlFromSector(req.params.id, url);
    return res.json({ sector: result.sector, message: "Grupo eliminado." });
  } catch (error) {
    return handleError(res, error);
  }
};

// ---------------------------------------------------------------------------
// Ajustes y salud del sistema
// ---------------------------------------------------------------------------

const getSettings = async (req, res) => {
  try {
    const publicSettings = await settingsService.getPublicSettings();
    return res.json(publicSettings);
  } catch (error) {
    return handleError(res, error);
  }
};

const saveSettings = async (req, res) => {
  try {
    await settingsService.updateSettings(req.body || {});
    const publicSettings = await settingsService.getPublicSettings();
    return res.json({ settings: publicSettings, message: "Configuración guardada." });
  } catch (error) {
    return handleError(res, error);
  }
};

const health = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    const report = {
      apify: { ok: false, message: "Sin token configurado" },
      gemini: { ok: false, message: "Sin llave configurada" },
      supabase: { ok: false, message: "Sin probar" },
      mongo: { ok: false, message: "Sin probar" },
    };

    if (settings.apifyToken) {
      try {
        const account = await apify.getAccount(settings.apifyToken);
        report.apify = {
          ok: true,
          message: `Apify conectado${account?.username ? ` (${account.username})` : ""}`,
          plan: account?.plan?.id || null,
        };
      } catch (error) {
        report.apify = { ok: false, message: error.message };
      }
    }

    if (settings.geminiKey) {
      report.gemini = await ai.checkHealth(settings.geminiKey);
    }

    try {
      const { error } = await supabase.from("users").select("id").limit(1);
      report.supabase = error
        ? { ok: false, message: error.message }
        : { ok: true, message: "Supabase conectado (CRM)" };
    } catch (error) {
      report.supabase = { ok: false, message: error.message };
    }

    try {
      const count = await leadsStore.getStats();
      report.mongo = { ok: true, message: `Base local conectada (${count.leadCount || 0} prospectos)` };
    } catch (error) {
      report.mongo = { ok: false, message: error.message };
    }

    await settingsService.saveHealth({ apify: report.apify.ok ? "ok" : "error", gemini: report.gemini.ok ? "ok" : "error" });

    return res.json({ report, checkedAt: new Date().toISOString() });
  } catch (error) {
    return handleError(res, error, "No se pudo verificar el estado del módulo.");
  }
};

const exportLeads = async (req, res) => {
  try {
    const viewer = await getViewer(req);
    const { format = "csv", filters = {} } = req.body || {};
    const result = await leadsStore.exportLeads({ filters, format, viewer });
    return res.json(result);
  } catch (error) {
    return handleError(res, error, "No se pudo exportar la información.");
  }
};

const importSeed = async (req, res) => {
  try {
    const result = await leadsStore.importSeedData();
    return res.json({
      ...result,
      message: `Catálogo histórico importado: ${result.created} nuevos, ${result.duplicates} repetidos.`,
    });
  } catch (error) {
    return handleError(res, error, "No se pudo importar el catálogo histórico.");
  }
};

module.exports = {
  index,
  bootstrap,
  getStats,
  getLeads,
  getLead,
  changeStatus,
  saveNotes,
  removeLead,
  matches,
  convertLead,
  startScrape,
  getJobs,
  getJob,
  cancelJob,
  getSectors,
  addSector,
  editSector,
  removeSector,
  addGroupUrl,
  removeGroupUrl,
  getSettings,
  saveSettings,
  health,
  exportLeads,
  importSeed,
};
