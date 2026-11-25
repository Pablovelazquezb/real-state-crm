import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaCog, FaFacebookF, FaHandshake, FaLayerGroup, FaPlay, FaSyncAlt, FaUsers } from "react-icons/fa";
import StatCards from "./components/StatCards";
import LeadCard from "./components/LeadCard";
import LeadFilters from "./components/LeadFilters";
import MatchList from "./components/MatchList";
import SectorsPanel from "./components/SectorsPanel";
import JobsPanel from "./components/JobsPanel";
import SettingsPanel from "./components/SettingsPanel";
import ScrapeModal from "./components/ScrapeModal";
import EmptyState from "./components/EmptyState";
import { api, apiMessage, downloadFile } from "./api";
import { DEFAULT_FILTERS, PAGE_SIZE } from "./constants";

const TABS = [
  { key: "prospectos", label: "Prospectos", icon: FaUsers },
  { key: "cruces", label: "Cruces", icon: FaHandshake },
  { key: "grupos", label: "Grupos", icon: FaFacebookF },
  { key: "actividad", label: "Actividad", icon: FaLayerGroup },
  { key: "ajustes", label: "Ajustes", icon: FaCog },
];

export default function FacebookProspector() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const cancelRef = useRef();

  const [booting, setBooting] = useState(true);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [zones, setZones] = useState([]);

  const [tabIndex, setTabIndex] = useState(0);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [importing, setImporting] = useState(false);
  const [startingScrape, setStartingScrape] = useState(false);
  const [busyLeadId, setBusyLeadId] = useState(null);
  const [sectorBusy, setSectorBusy] = useState(false);

  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchTarget, setMatchTarget] = useState(null);

  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [scrapeSectorId, setScrapeSectorId] = useState(null);
  const scrapeModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [leadToDelete, setLeadToDelete] = useState(null);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const tabBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  const activeJobsRef = useRef(new Set());

  const notify = useCallback(
    ({ title, description, status = "success" }) => toast({ title, description, status, duration: 4500, isClosable: true, position: "top-right" }),
    [toast],
  );

  // ---------------------------------------------------------------------------
  // Carga de datos
  // ---------------------------------------------------------------------------

  const loadLeads = useCallback(
    async ({ nextPage = 1, append = false, silent = false } = {}) => {
      if (!silent) setLoadingLeads(true);

      const response = await api.leads({
        ...filters,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (response?.status === 200) {
        const data = response.data;
        setLeads((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
        setPage(nextPage);
      } else {
        notify({ title: "No se pudieron cargar los prospectos", description: apiMessage(response), status: "error" });
      }

      setLoadingLeads(false);
    },
    [filters, notify],
  );

  const loadBootstrap = useCallback(async () => {
    setBooting(true);
    const response = await api.bootstrap();

    if (response?.status === 200) {
      const data = response.data;
      setStats(data.stats);
      setSectors(data.sectors || []);
      setSettings(data.settings);
      setJobs(data.jobs || []);
      setZones(data.zones || []);
    } else {
      notify({ title: "No se pudo iniciar el módulo", description: apiMessage(response), status: "error" });
    }

    setBooting(false);
  }, [notify]);

  const refreshStats = useCallback(async () => {
    const response = await api.stats();
    if (response?.status === 200) setStats(response.data);
  }, []);

  const refreshJobs = useCallback(async () => {
    const response = await api.jobs();
    if (response?.status === 200) setJobs(response.data);
    return response;
  }, []);

  const loadMatches = useCallback(
    async (leadId) => {
      setMatchesLoading(true);
      const response = await api.matches(leadId);
      if (response?.status === 200) {
        setMatches(response.data.matches || []);
        setMatchTarget(response.data.target || null);
      } else {
        notify({ title: "No se pudieron calcular los cruces", description: apiMessage(response), status: "error" });
      }
      setMatchesLoading(false);
    },
    [notify],
  );

  // Primera carga
  useEffect(() => {
    document.title = "Prospector FB · Nova CRM";
    loadBootstrap();
    handleCheckHealth();

    // Permite llegar desde "Mi panel" con el modal de extracción abierto
    // o con una búsqueda prellenada.
    const quickSearch = searchParams.get("q");
    if (quickSearch) {
      setFilters((prev) => ({ ...prev, search: quickSearch }));
    }

    if (searchParams.get("nueva")) {
      scrapeModal.onOpen();
    }

    if (quickSearch || searchParams.get("nueva")) {
      searchParams.delete("nueva");
      searchParams.delete("q");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda y filtros con retardo para no saturar el servidor
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads({ nextPage: 1 });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const hasActiveJobs = useMemo(
    () => jobs.some((job) => job.status === "running" || job.status === "queued"),
    [jobs],
  );

  // Sondeo de extracciones activas
  useEffect(() => {
    if (!hasActiveJobs) return undefined;

    const interval = setInterval(async () => {
      const response = await refreshJobs();
      if (response?.status !== 200) return;

      const finished = response.data.filter(
        (job) => !["running", "queued"].includes(job.status) && activeJobsRef.current.has(job._id),
      );

      if (finished.length) {
        finished.forEach((job) => {
          activeJobsRef.current.delete(job._id);
          if (job.status === "succeeded") {
            notify({
              title: "Extracción completada",
              description: `${job.leadsCreated} prospectos nuevos, ${job.duplicates} repetidos.`,
            });
          } else if (job.status === "failed") {
            notify({ title: "La extracción falló", description: job.error, status: "error" });
          }
        });

        refreshStats();
        loadLeads({ nextPage: 1, silent: true });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [hasActiveJobs, notify, refreshJobs, refreshStats, loadLeads]);

  // ---------------------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------------------

  const handleFilterChange = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const handleResetFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const handleStatus = async (lead, status) => {
    setBusyLeadId(lead._id);
    const response = await api.updateStatus(lead._id, status);

    if (response?.status === 200) {
      setLeads((prev) => prev.map((item) => (item._id === lead._id ? { ...item, status } : item)));
      refreshStats();
      notify({ title: "Estado actualizado" });
    } else {
      notify({ title: "No se pudo cambiar el estado", description: apiMessage(response), status: "error" });
    }

    setBusyLeadId(null);
  };

  const handleConvert = async (lead) => {
    setBusyLeadId(lead._id);
    const response = await api.convertLead(lead._id);

    if (response?.status === 200) {
      const updated = response.data.lead;
      setLeads((prev) =>
        prev.map((item) =>
          item._id === lead._id
            ? { ...item, status: updated?.status || "convertido", convertedLeadId: updated?.convertedLeadId || "crm" }
            : item,
        ),
      );
      refreshStats();
      notify({ title: "Prospecto enviado al CRM", description: response.data.message });
    } else {
      notify({ title: "No se pudo enviar al CRM", description: apiMessage(response), status: "error" });
    }

    setBusyLeadId(null);
  };

  const handleDeleteRequest = (lead) => {
    setLeadToDelete(lead);
    deleteDialog.onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    const response = await api.removeLead(leadToDelete._id);

    if (response?.status === 200) {
      setLeads((prev) => prev.filter((item) => item._id !== leadToDelete._id));
      refreshStats();
      notify({ title: "Prospecto eliminado" });
    } else {
      notify({ title: "No se pudo eliminar", description: apiMessage(response), status: "error" });
    }

    setLeadToDelete(null);
    deleteDialog.onClose();
  };

  const handleOpenMatches = async (lead) => {
    setTabIndex(1);
    await loadMatches(lead._id);
  };

  const handleExport = async (format) => {
    setExporting(true);
    const response = await api.exportLeads(format, filters);

    if (response?.status === 200) {
      downloadFile(response.data);
      notify({ title: "Archivo generado", description: `${response.data.total} prospectos exportados.` });
    } else {
      notify({ title: "No se pudo exportar", description: apiMessage(response), status: "error" });
    }

    setExporting(false);
  };

  const handleImportSeed = async () => {
    setImporting(true);
    const response = await api.importSeed();

    if (response?.status === 200) {
      notify({ title: "Catálogo importado", description: response.data.message });
      await Promise.all([refreshStats(), loadLeads({ nextPage: 1, silent: true })]);
    } else {
      notify({ title: "No se pudo importar", description: apiMessage(response), status: "error" });
    }

    setImporting(false);
  };

  const handleSaveSettings = async (payload, onDone) => {
    setSavingSettings(true);
    const response = await api.saveSettings(payload);

    if (response?.status === 200) {
      setSettings(response.data.settings);
      notify({ title: "Configuración guardada" });
      if (onDone) onDone();
    } else {
      notify({ title: "No se pudo guardar", description: apiMessage(response), status: "error" });
    }

    setSavingSettings(false);
  };

  const handleCheckHealth = async () => {
    setHealthLoading(true);
    const response = await api.health();

    if (response?.status === 200) {
      setHealth(response.data);
    } else {
      notify({ title: "No se pudo verificar", description: apiMessage(response), status: "error" });
    }

    setHealthLoading(false);
  };

  const openScrape = (sector = null) => {
    setScrapeSectorId(sector?._id || null);
    scrapeModal.onOpen();
  };

  const handleStartScrape = async (payload) => {
    setStartingScrape(true);
    const response = await api.scrape(payload);

    if (response?.status === 201) {
      const job = response.data.job;
      activeJobsRef.current.add(job._id);
      setJobs((prev) => [job, ...prev]);
      scrapeModal.onClose();
      setTabIndex(3);
      notify({ title: "Extracción iniciada", description: response.data.message });
    } else {
      notify({ title: "No se pudo iniciar la extracción", description: apiMessage(response), status: "error" });
    }

    setStartingScrape(false);
  };

  const handleCancelJob = async (job) => {
    const response = await api.cancelJob(job._id);
    if (response?.status === 200) {
      setJobs((prev) => prev.map((item) => (item._id === job._id ? { ...item, status: "cancelled", stage: "Cancelada" } : item)));
      notify({ title: "Extracción cancelada" });
    } else {
      notify({ title: "No se pudo cancelar", description: apiMessage(response), status: "error" });
    }
  };

  const handleRetryJob = (job) => {
    setScrapeSectorId(job.sectorId || null);
    scrapeModal.onOpen();
  };

  const handleAddSector = async (payload) => {
    setSectorBusy(true);
    const response = await api.createSector(payload);
    setSectorBusy(false);

    if (response?.status === 201) {
      setSectors((prev) => [...prev, response.data.sector]);
      notify({ title: "Sector creado" });
      return true;
    }

    notify({ title: "No se pudo crear el sector", description: apiMessage(response), status: "error" });
    return false;
  };

  const handleDeleteSector = async (sector) => {
    const response = await api.removeSector(sector._id);
    if (response?.status === 200) {
      setSectors((prev) => prev.filter((item) => item._id !== sector._id));
      notify({ title: "Sector eliminado" });
    } else {
      notify({ title: "No se pudo eliminar el sector", description: apiMessage(response), status: "error" });
    }
  };

  const handleAddUrl = async (sector, url) => {
    const response = await api.addUrl(sector._id, url);
    if (response?.status === 200) {
      setSectors((prev) => prev.map((item) => (item._id === sector._id ? response.data.sector : item)));
      notify({ title: response.data.message });
      return true;
    }

    notify({ title: "No se pudo agregar el grupo", description: apiMessage(response), status: "error" });
    return false;
  };

  const handleRemoveUrl = async (sector, url) => {
    const response = await api.removeUrl(sector._id, url);
    if (response?.status === 200) {
      setSectors((prev) => prev.map((item) => (item._id === sector._id ? response.data.sector : item)));
      notify({ title: "Grupo eliminado" });
    } else {
      notify({ title: "No se pudo eliminar el grupo", description: apiMessage(response), status: "error" });
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const apifyStatus = health?.report?.apify;
  const hasFilters = useMemo(
    () =>
      filters.section !== "all" ||
      filters.zone !== "all" ||
      filters.status !== "all" ||
      filters.posterType !== "all" ||
      Boolean(filters.search) ||
      filters.hotOnly ||
      filters.phoneOnly ||
      filters.mine,
    [filters],
  );

  return (
    <Box>
      <Flex align="start" justify="space-between" gap="16px" mb="20px" wrap="wrap">
        <Box>
          <HStack spacing="10px">
            <Flex align="center" justify="center" w="38px" h="38px" borderRadius="12px" bg="#1877F2">
              <Icon as={FaFacebookF} color="white" boxSize="16px" />
            </Flex>
            <Box>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color={textColor} lineHeight="1.2">
                Prospector Facebook
              </Text>
              <Text fontSize="sm" color={muted}>
                Prospectos inmobiliarios detectados y clasificados desde tus grupos
              </Text>
            </Box>
          </HStack>
        </Box>

        <HStack spacing="10px" wrap="wrap">
          <Tooltip
            label={
              apifyStatus
                ? apifyStatus.message
                : settings?.hasApifyToken
                  ? "Token configurado. Verifica la conexión en Ajustes."
                  : "Configura tu token de Apify en Ajustes"
            }
            hasArrow
          >
            <Badge
              as="button"
              onClick={() => setTabIndex(4)}
              colorScheme={apifyStatus ? (apifyStatus.ok ? "green" : "red") : settings?.hasApifyToken ? "yellow" : "orange"}
              borderRadius="full"
              px="12px"
              py="6px"
              fontSize="xs"
              fontWeight="700"
              textTransform="none"
              cursor="pointer"
            >
              {apifyStatus
                ? apifyStatus.ok
                  ? "Apify conectado"
                  : "Apify con error"
                : settings?.hasApifyToken
                  ? "Token configurado"
                  : "Sin token de Apify"}
            </Badge>
          </Tooltip>

          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Icon as={FaSyncAlt} boxSize="10px" />}
            onClick={() => {
              loadBootstrap();
              loadLeads({ nextPage: 1, silent: true });
            }}
            fontWeight="600"
          >
            Actualizar
          </Button>

          <Button size="sm" variant="brand" leftIcon={<Icon as={FaPlay} boxSize="10px" />} onClick={() => openScrape()}>
            Nueva extracción
          </Button>
        </HStack>
      </Flex>

      <Box mb="20px">
        <StatCards stats={stats} loading={booting} />
      </Box>

      <Tabs index={tabIndex} onChange={setTabIndex} variant="unstyled">
        <TabList
          bg={tabBg}
          p="4px"
          borderRadius="full"
          w="fit-content"
          maxW="100%"
          overflowX="auto"
          gap="4px"
          border="none"
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.key}
              h="34px"
              px={{ base: "12px", md: "16px" }}
              borderRadius="full"
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="700"
              color={muted}
              whiteSpace="nowrap"
              _selected={{ bg: "brand.500", color: "white" }}
              _focus={{ boxShadow: "none" }}
              leftIcon={<Icon as={tab.icon} boxSize="11px" />}
            >
              {tab.label}
              {tab.key === "cruces" && stats?.matches ? (
                <Badge ml="6px" borderRadius="full" bg="whiteAlpha.300" color="inherit" fontSize="10px">
                  {stats.matches}
                </Badge>
              ) : null}
            </Tab>
          ))}
        </TabList>

        <TabPanels mt="18px">
          <TabPanel p="0">
            <Box mb="16px">
              <LeadFilters
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                zones={zones}
                total={total}
                loading={loadingLeads}
                onRefresh={() => loadLeads({ nextPage: 1 })}
                onExport={handleExport}
                exporting={exporting}
              />
            </Box>

            {loadingLeads && leads.length === 0 ? (
              <SimpleGrid columns={{ base: 1, xl: 2 }} gap="16px">
                {[0, 1, 2, 3].map((key) => (
                  <Card key={key} p="20px">
                    <Skeleton height="18px" width="45%" borderRadius="6px" />
                    <Skeleton height="14px" width="65%" mt="10px" borderRadius="6px" />
                    <Skeleton height="60px" mt="12px" borderRadius="8px" />
                  </Card>
                ))}
              </SimpleGrid>
            ) : leads.length === 0 ? (
              <Card p="0">
                {hasFilters ? (
                  <EmptyState
                    icon={FaUsers}
                    title="Sin resultados con estos filtros"
                    description="Prueba con otra zona, sección o limpia los filtros para ver todos los prospectos."
                    actionLabel="Limpiar filtros"
                    onAction={handleResetFilters}
                  />
                ) : (
                  <EmptyState
                    icon={FaFacebookF}
                    title="Todavía no hay prospectos"
                    description="Lanza una extracción de tus grupos de Facebook o importa el catálogo del scraper original para empezar."
                    actionLabel="Nueva extracción"
                    onAction={() => openScrape()}
                    secondaryLabel="Importar catálogo histórico"
                    onSecondary={handleImportSeed}
                  />
                )}
              </Card>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, xl: 2 }} gap="16px">
                  {leads.map((lead) => (
                    <LeadCard
                      key={lead._id}
                      lead={lead}
                      onStatus={handleStatus}
                      onConvert={handleConvert}
                      onDelete={handleDeleteRequest}
                      onMatches={handleOpenMatches}
                      busy={busyLeadId === lead._id}
                    />
                  ))}
                </SimpleGrid>

                {hasMore ? (
                  <Flex justify="center" mt="20px">
                    <Button
                      size="sm"
                      variant="lightBrand"
                      onClick={() => loadLeads({ nextPage: page + 1, append: true })}
                      isLoading={loadingLeads}
                      fontWeight="700"
                    >
                      Cargar más prospectos
                    </Button>
                  </Flex>
                ) : (
                  <Text textAlign="center" fontSize="xs" color={muted} mt="18px">
                    Has visto los {total} prospectos de esta búsqueda.
                  </Text>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel p="0">
            <MatchList
              matches={matches}
              loading={matchesLoading}
              target={matchTarget}
              onClearTarget={() => loadMatches()}
            />
            {!matchesLoading && matches.length === 0 ? (
              <Card p="0" mt="16px">
                <EmptyState
                  icon={FaHandshake}
                  title="Aún no hay cruces compatibles"
                  description="Necesitas al menos un prospecto que busca (demanda o roomie) y otro que ofrece en la misma zona para generar cruces."
                  actionLabel="Ver prospectos"
                  onAction={() => setTabIndex(0)}
                />
              </Card>
            ) : null}
          </TabPanel>

          <TabPanel p="0">
            <SectorsPanel
              sectors={sectors}
              loading={booting}
              onAddSector={handleAddSector}
              onDeleteSector={handleDeleteSector}
              onAddUrl={handleAddUrl}
              onRemoveUrl={handleRemoveUrl}
              onScrapeSector={(sector) => openScrape(sector)}
              saving={sectorBusy}
            />
          </TabPanel>

          <TabPanel p="0">
            <JobsPanel
              jobs={jobs}
              loading={booting}
              onCancel={handleCancelJob}
              onRetry={handleRetryJob}
              onNewScrape={() => openScrape()}
            />
          </TabPanel>

          <TabPanel p="0">
            <SettingsPanel
              settings={settings}
              health={health}
              healthLoading={healthLoading}
              saving={savingSettings}
              importing={importing}
              exporting={exporting}
              stats={stats}
              onSave={handleSaveSettings}
              onCheckHealth={handleCheckHealth}
              onImportSeed={handleImportSeed}
              onExport={handleExport}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ScrapeModal
        isOpen={scrapeModal.isOpen}
        onClose={scrapeModal.onClose}
        sectors={sectors}
        settings={settings}
        initialSectorId={scrapeSectorId}
        onStart={handleStartScrape}
        loading={startingScrape}
        activeJobs={hasActiveJobs}
      />

      <AlertDialog isOpen={deleteDialog.isOpen} leastDestructiveRef={cancelRef} onClose={deleteDialog.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="18px">
            <AlertDialogHeader fontSize="lg" fontWeight="800">
              Eliminar prospecto
            </AlertDialogHeader>
            <AlertDialogBody fontSize="sm">
              ¿Seguro que quieres eliminar a <b>{leadToDelete?.userName}</b> del Prospector? Esta acción no se puede
              deshacer (el Lead del CRM, si ya lo enviaste, se conserva).
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} size="sm" variant="ghost" onClick={deleteDialog.onClose}>
                Cancelar
              </Button>
              <Button size="sm" ml="10px" bg="red.500" color="white" _hover={{ bg: "red.600" }} onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Box>
  );
}
