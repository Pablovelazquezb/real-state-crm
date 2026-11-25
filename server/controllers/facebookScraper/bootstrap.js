/**
 * Inicialización del módulo Prospector FB.
 *
 * - Da visibilidad del módulo a todos los roles existentes (los empleados
 *   lo ven en el menú; el administrador puede quitarlo desde Roles).
 * - Registra el módulo en "Active Deactive Module".
 * - Carga los sectores del scraper original la primera vez.
 * - Marca como interrumpidas las extracciones que quedaron colgadas.
 */

const RoleAccess = require("../../model/schema/roleAccess");
const ModuleActiveDeactive = require("../../model/schema/moduleActiveDeactive");
const sectors = require("./sectors");
const scraper = require("./scraper");

const MODULE_TITLE = "Prospector FB";

async function ensureRoleAccess() {
  const roles = await RoleAccess.find({});
  let updated = 0;

  for (const role of roles) {
    const hasModule = (role.access || []).some(
      (item) => String(item.title || "").toLowerCase() === MODULE_TITLE.toLowerCase(),
    );

    if (!hasModule) {
      role.access = [
        ...(role.access || []),
        { title: MODULE_TITLE, create: false, update: true, delete: false, view: true },
      ];
      await role.save();
      updated += 1;
    }
  }

  return { roles: roles.length, updated };
}

async function ensureModuleRecord() {
  const existing = await ModuleActiveDeactive.findOne({ moduleName: MODULE_TITLE });
  if (existing) return { created: false };

  const last = await ModuleActiveDeactive.findOne({}).sort({ order: -1 });
  await ModuleActiveDeactive.create({
    moduleName: MODULE_TITLE,
    order: (last?.order || 0) + 1,
    isActive: true,
  });

  return { created: true };
}

async function initFacebookScraperModule() {
  try {
    const [access, moduleRecord, sectorSeed, recovered] = await Promise.all([
      ensureRoleAccess(),
      ensureModuleRecord(),
      sectors.seedSectors(),
      scraper.recoverInterruptedJobs(),
    ]);

    if (sectorSeed.seeded) {
      console.log(`[Prospector FB] Sectores iniciales cargados: ${sectorSeed.count}.`);
    }
    if (moduleRecord.created) {
      console.log("[Prospector FB] Módulo registrado en Active Deactive Module.");
    }
    if (access.updated > 0) {
      console.log(`[Prospector FB] Acceso agregado a ${access.updated} rol(es).`);
    }
    if (recovered > 0) {
      console.log(`[Prospector FB] ${recovered} extracción(es) marcadas como interrumpidas.`);
    }
  } catch (error) {
    console.log("[Prospector FB] Inicialización omitida:", error.message);
  }
}

module.exports = { initFacebookScraperModule, MODULE_TITLE };
