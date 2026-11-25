const FacebookJob = require("../../model/schema/facebookJob");
const apify = require("./apify");
const ai = require("./ai");
const { getSettings } = require("./settings");
const { normalizeAndClassifyLead } = require("./dataProcessor");
const { upsertLeads } = require("./leadsStore");
const { getUrlsForSector } = require("./sectors");

const MAX_CONCURRENT_JOBS = 3;
const MAX_JOB_MINUTES = 25;
const POLL_INTERVAL_MS = 6000;

const runningJobs = new Set();

const pushLog = async (jobId, message) => {
  try {
    await FacebookJob.updateOne(
      { _id: jobId },
      {
        $push: { logs: { $each: [`${new Date().toISOString()} · ${message}`], $slice: -40 } },
      },
    );
  } catch (error) {
    // Un log no debe romper la extracción.
  }
};

/**
 * Marca como fallidos los jobs que quedaron a medias por un reinicio.
 */
async function recoverInterruptedJobs() {
  const result = await FacebookJob.updateMany(
    { status: { $in: ["running", "queued"] } },
    {
      $set: {
        status: "failed",
        stage: "Interrumpido",
        error: "La extracción se interrumpió por un reinicio del servidor. Vuelve a intentarlo.",
        finishedAt: new Date(),
      },
    },
  );
  return result.modifiedCount || 0;
}

async function waitForRun(token, job, runId) {
  const startedAt = Date.now();
  let consecutiveErrors = 0;

  while (Date.now() - startedAt < MAX_JOB_MINUTES * 60 * 1000) {
    let run = null;

    try {
      // Apify puede tardar un instante en exponer el run recién creado:
      // los 404/inestabilidades iniciales se reintentan en lugar de fallar.
      run = await apify.getRun(token, runId);
      consecutiveErrors = 0;
    } catch (error) {
      consecutiveErrors += 1;
      await pushLog(job._id, `Reintentando consulta del run (${consecutiveErrors}/10): ${error.message}`);

      if (consecutiveErrors >= 10) {
        throw new Error(
          `No se pudo consultar la ejecución ${runId} en Apify. Verifica el run en la consola de Apify (${error.message}).`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      continue;
    }

    if (!run) throw new Error("No se pudo consultar el estado de la ejecución en Apify.");

    if (run.status === "SUCCEEDED") return run;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) {
      throw new Error(`Apify terminó la ejecución con estado ${run.status}.`);
    }

    await FacebookJob.updateOne(
      { _id: job._id },
      { $set: { stage: `Apify trabajando (${run.status || "RUNNING"})` } },
    );

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("La extracción excedió el tiempo máximo de espera (25 minutos).");
}

async function executeJob(jobId) {
  const job = await FacebookJob.findById(jobId);
  if (!job) return;

  runningJobs.add(String(jobId));

  try {
    const settings = await getSettings();

    if (!settings.apifyToken) {
      throw new Error("Falta configurar el token de Apify. Hazlo en Ajustes del módulo Prospector FB.");
    }

    await FacebookJob.updateOne(
      { _id: job._id },
      { $set: { status: "running", stage: "Iniciando actor en Apify", startedAt: new Date(), error: null } },
    );
    await pushLog(job._id, `Iniciando extracción de ${job.urls.length} grupo(s) con límite ${job.resultsLimit}.`);

    const run = await apify.startRun(settings.apifyToken, {
      urls: job.urls,
      resultsLimit: job.resultsLimit,
      actorId: job.actorId,
    });

    await FacebookJob.updateOne(
      { _id: job._id },
      { $set: { runId: run.id, datasetId: run.defaultDatasetId || null, stage: "Apify trabajando (READY)" } },
    );

    // Se usa el id recién creado (el documento en memoria aún no lo tiene).
    job.runId = run.id;
    const finished = await waitForRun(settings.apifyToken, job, run.id);
    const datasetId = finished.defaultDatasetId || run.defaultDatasetId;

    if (!datasetId) throw new Error("Apify no devolvió un dataset con resultados.");

    await FacebookJob.updateOne(
      { _id: job._id },
      { $set: { datasetId, stage: "Descargando publicaciones" } },
    );

    const items = await apify.getDatasetItems(settings.apifyToken, datasetId, { limit: 1000 });
    await pushLog(job._id, `Se descargaron ${items.length} publicaciones del dataset.`);

    if (items.length === 0) {
      await FacebookJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: "succeeded",
            stage: "Completado sin resultados",
            itemsFetched: 0,
            finishedAt: new Date(),
          },
        },
      );
      return;
    }

    const sector = job.sectorId ? await getUrlsForSector(job.sectorId) : null;
    const context = {
      sectorId: job.sectorId || null,
      sectorName: job.sectorName || sector?.sector?.name || null,
      ownerId: job.ownerId || null,
      ownerName: job.ownerName || null,
    };

    let normalized = items.map((item) => normalizeAndClassifyLead(item, context));

    await FacebookJob.updateOne(
      { _id: job._id },
      { $set: { stage: "Clasificando prospectos", itemsFetched: normalized.length } },
    );

    if (job.aiEnrich) {
      if (!settings.geminiKey) {
        await pushLog(job._id, "Enriquecimiento con IA omitido: no hay llave de Gemini configurada.");
      } else {
        await FacebookJob.updateOne({ _id: job._id }, { $set: { stage: "Analizando con IA" } });

        for (let index = 0; index < normalized.length; index += 12) {
          const chunk = normalized.slice(index, index + 12);
          try {
            // eslint-disable-next-line no-await-in-loop
            const result = await ai.enrichBatch(chunk, settings.geminiKey);
            if (result.warning) await pushLog(job._id, `IA: ${result.warning}`);
          } catch (error) {
            await pushLog(job._id, `IA: ${error.message}`);
            break;
          }
        }

        // Recalcular campos derivados tras la corrección de la IA.
        normalized = normalized.map((lead) => ({
          ...lead,
          section: lead.role.startsWith("roomie")
            ? "roomies"
            : lead.role.startsWith("demand")
              ? "demanda"
              : lead.role === "spam"
                ? "otro"
                : "renta",
        }));
      }
    }

    await FacebookJob.updateOne({ _id: job._id }, { $set: { stage: "Guardando prospectos" } });

    const result = await upsertLeads(normalized);

    await FacebookJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "succeeded",
          stage: "Completado",
          leadsCreated: result.created,
          duplicates: result.duplicates,
          skipped: result.skipped,
          finishedAt: new Date(),
        },
      },
    );

    await pushLog(
      job._id,
      `Listo: ${result.created} nuevos, ${result.duplicates} repetidos, ${result.skipped} descartados.`,
    );
  } catch (error) {
    await FacebookJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "failed",
          stage: "Error",
          error: String(error.message || error),
          finishedAt: new Date(),
        },
      },
    );
    await pushLog(job._id, `Error: ${error.message || error}`);
  } finally {
    runningJobs.delete(String(jobId));
  }
}

async function countActiveJobs() {
  return FacebookJob.countDocuments({ status: { $in: ["queued", "running"] } });
}

/**
 * Crea y lanza una extracción en segundo plano.
 */
async function createJob({ urls, sector = null, resultsLimit = 40, aiEnrich = false, user = {} }) {
  const cleanUrls = apify.cleanUrls(urls);
  if (cleanUrls.length === 0) {
    throw Object.assign(new Error("Selecciona al menos un grupo de Facebook válido."), { status: 400 });
  }

  const active = await countActiveJobs();
  if (active >= MAX_CONCURRENT_JOBS) {
    throw Object.assign(
      new Error("Ya hay varias extracciones en curso. Espera a que terminen para lanzar otra."),
      { status: 429 },
    );
  }

  const job = await FacebookJob.create({
    status: "queued",
    stage: "En cola",
    urls: cleanUrls,
    sectorId: sector?.sectorId || sector?.id || null,
    sectorName: sector?.name || null,
    resultsLimit: Math.max(1, Math.min(Number(resultsLimit) || 40, 500)),
    aiEnrich: Boolean(aiEnrich),
    ownerId: user?.id ? String(user.id) : null,
    ownerName: user?.name || null,
  });

  // Se ejecuta sin bloquear la petición HTTP.
  setImmediate(() => {
    executeJob(job._id).catch((error) => {
      console.error("[Prospector FB] Error no controlado:", error.message);
    });
  });

  return job;
}

async function cancelJob(id) {
  const job = await FacebookJob.findById(id);
  if (!job) throw Object.assign(new Error("Extracción no encontrada."), { status: 404 });
  if (!["queued", "running"].includes(job.status)) return job;

  const settings = await getSettings();
  if (job.runId && settings.apifyToken) await apify.abortRun(settings.apifyToken, job.runId);

  job.status = "cancelled";
  job.stage = "Cancelada";
  job.finishedAt = new Date();
  await job.save();
  return job;
}

async function listJobs(limit = 12) {
  return FacebookJob.find({}).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 12, 50)).lean();
}

async function getJob(id) {
  return FacebookJob.findById(id).lean();
}

module.exports = {
  createJob,
  executeJob,
  listJobs,
  getJob,
  cancelJob,
  recoverInterruptedJobs,
  countActiveJobs,
};
