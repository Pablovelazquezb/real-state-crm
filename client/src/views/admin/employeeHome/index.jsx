import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  Tooltip,
  useColorModeValue,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaFacebookF,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaHandshake,
  FaMapMarkerAlt,
  FaPlay,
  FaRobot,
  FaWhatsapp,
} from "react-icons/fa";
import { getApi } from "services/api";
import StatCards from "views/admin/facebookProspector/components/StatCards";
import { JOB_STATUS, formatDateTime, scoreScheme } from "views/admin/facebookProspector/constants";

const MODULE_TITLE = "Prospector FB";

const greetingByHour = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

const initialsOf = (user) =>
  `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() ||
  user?.username?.[0]?.toUpperCase() ||
  "N";

const HotLeadRow = ({ lead, onOpen, muted, textColor }) => {
  const hoverBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const iconBg = useColorModeValue("brand.50", "whiteAlpha.100");

  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      align={{ base: "stretch", md: "center" }}
      justify="space-between"
      gap="10px"
      p="12px"
      borderRadius="14px"
      transition="background .15s ease"
      _hover={{ bg: hoverBg }}
      cursor="pointer"
      onClick={() => onOpen(lead)}
    >
      <HStack spacing="10px" minW="0" flex="1">
        <Flex align="center" justify="center" w="36px" h="36px" borderRadius="12px" bg={iconBg} flexShrink={0}>
          <Icon as={FaFire} color="orange.400" boxSize="13px" />
        </Flex>
        <Box minW="0">
          <Text fontSize="sm" fontWeight="800" color={textColor} noOfLines={1}>
            {lead.userName}
          </Text>
          <Text fontSize="xs" color={muted} noOfLines={1}>
            {lead.zone} · {lead.priceDisplay}
          </Text>
        </Box>
      </HStack>

      <HStack spacing="6px" justify="space-between" flexShrink={0}>
        <Badge colorScheme={scoreScheme(lead.leadScore)} borderRadius="full" px="8px" fontWeight="800">
          {lead.leadScore} pts
        </Badge>
        {lead.phone ? (
          <Button
            as="a"
            href={lead.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            size="xs"
            bg="#25D366"
            color="white"
            leftIcon={<Icon as={FaWhatsapp} boxSize="10px" />}
            _hover={{ bg: "#1eb85a" }}
            onClick={(event) => event.stopPropagation()}
            fontWeight="700"
          >
            WhatsApp
          </Button>
        ) : (
          <Button
            size="xs"
            variant="ghost"
            color={muted}
            rightIcon={<Icon as={FaArrowRight} boxSize="9px" />}
            fontWeight="700"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(lead);
            }}
          >
            Ver ficha
          </Button>
        )}
      </HStack>
    </Flex>
  );
};

const JobRow = ({ job, muted, textColor, borderColor }) => {
  const status = JOB_STATUS[job.status] || JOB_STATUS.queued;

  return (
    <Flex align="center" justify="space-between" gap="10px" py="8px" borderBottom="1px solid" borderColor={borderColor}>
      <Box minW="0">
        <HStack spacing="6px">
          <Badge colorScheme={status.scheme} borderRadius="full" fontSize="10px" fontWeight="800">
            {status.label}
          </Badge>
          <Text fontSize="xs" fontWeight="700" color={textColor} noOfLines={1}>
            {job.sectorName || "Extracción"}
          </Text>
        </HStack>
        <Text fontSize="10px" color={muted}>
          {formatDateTime(job.createdAt)} · {job.leadsCreated || 0} nuevos
        </Text>
      </Box>
      <Icon as={job.status === "succeeded" ? FaCheckCircle : FaClock} color={job.status === "succeeded" ? "green.400" : muted} boxSize="12px" />
    </Flex>
  );
};

export default function EmployeeHome() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [hotLeads, setHotLeads] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [sectorInfo, setSectorInfo] = useState({ total: 0, groups: 0 });

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const softBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  const permissions = useMemo(() => {
    const access = (user?.roles || []).flatMap((role) => role?.access || []);
    return access.filter((item) => item?.view).map((item) => item.title);
  }, [user]);

  const hasProspector = user?.role === "superAdmin" || permissions.includes(MODULE_TITLE);

  const loadData = useCallback(async () => {
    if (!hasProspector) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [statsRes, leadsRes, jobsRes, sectorsRes] = await Promise.all([
      getApi("api/facebook-scraper/stats"),
      getApi("api/facebook-scraper/leads?hotOnly=true&sort=score&limit=6"),
      getApi("api/facebook-scraper/jobs?limit=3"),
      getApi("api/facebook-scraper/sectors"),
    ]);

    if (statsRes?.status === 200) setStats(statsRes.data);
    if (leadsRes?.status === 200) setHotLeads(leadsRes.data.items || []);
    if (jobsRes?.status === 200) setJobs(jobsRes.data || []);
    if (sectorsRes?.status === 200) {
      setSectorInfo({
        total: sectorsRes.data.sectors?.length || 0,
        groups: sectorsRes.data.totalGroups || 0,
      });
    }
    setLoading(false);
  }, [hasProspector]);

  useEffect(() => {
    document.title = "Mi panel · Nova CRM";
    loadData();
  }, [loadData]);

  const goToProspector = () => navigate("/prospector-fb");

  const openLead = (lead) =>
    navigate(`/prospector-fb?q=${encodeURIComponent(lead?.userName || "")}`);

  const hotCount = stats?.hot || 0;

  return (
    <Box>
      {/* Encabezado personal */}
      <Card
        p={{ base: "20px", md: "26px" }}
        mb="20px"
        bg="linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)"
        color="white"
        overflow="hidden"
      >
        <Flex align="center" justify="space-between" gap="18px" wrap="wrap">
          <HStack spacing="16px" minW="0">
            <Avatar
              name={initialsOf(user)}
              size="lg"
              bg="whiteAlpha.300"
              color="white"
              fontWeight="800"
              border="2px solid"
              borderColor="whiteAlpha.400"
            />
            <Box minW="0">
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="800" lineHeight="1.2">
                {greetingByHour()}, {user?.firstName || "equipo"} 👋
              </Text>
              <Text fontSize="sm" color="whiteAlpha.900" mt="2px">
                {hasProspector
                  ? hotCount > 0
                    ? `Tienes ${hotCount} prospecto${hotCount === 1 ? "" : "s"} caliente${hotCount === 1 ? "" : "s"} esperando contacto.`
                    : "Tu bandeja de prospectos está al día. Lanza una extracción para traer más."
                  : "Bienvenido a tu panel de trabajo. Tu administrador aún no te asignó módulos."}
              </Text>
            </Box>
          </HStack>

          {hasProspector ? (
            <HStack spacing="10px" wrap="wrap">
              <Button
                size="sm"
                bg="white"
                color="brand.600"
                leftIcon={<Icon as={FaFacebookF} boxSize="11px" />}
                _hover={{ bg: "whiteAlpha.900" }}
                fontWeight="800"
                onClick={goToProspector}
              >
                Ir al Prospector
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderColor="whiteAlpha.500"
                color="white"
                leftIcon={<Icon as={FaPlay} boxSize="10px" />}
                _hover={{ bg: "whiteAlpha.200" }}
                fontWeight="700"
                onClick={() => navigate("/prospector-fb?nueva=1")}
              >
                Nueva extracción
              </Button>
            </HStack>
          ) : null}
        </Flex>
      </Card>

      {!hasProspector ? (
        <Card p="24px">
          <Text fontWeight="800" color={textColor} fontSize="lg">
            Tu acceso
          </Text>
          <Text fontSize="sm" color={muted} mt="4px">
            Estos son los módulos habilitados para tu rol. Si necesitas más, pídeselos a tu administrador.
          </Text>
          <Wrap mt="16px" spacing="8px">
            {(permissions.length > 0 ? permissions : ["Sin módulos asignados"]).map((title) => (
              <WrapItem key={title}>
                <Badge colorScheme="brand" variant="subtle" borderRadius="full" px="12px" py="6px" fontSize="xs" fontWeight="700">
                  {title}
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        </Card>
      ) : (
        <>
          <Box mb="20px">
            <StatCards stats={stats} loading={loading} />
          </Box>

          <SimpleGrid columns={{ base: 1, xl: 3 }} gap="16px" alignItems="start">
            <Card
              p="20px"
              gridColumn={{ base: "auto", xl: "span 2" }}
              alignSelf="start"
              border="1px solid"
              borderColor={borderColor}
            >
              <Flex align="center" justify="space-between" mb="12px" gap="10px" wrap="wrap">
                <HStack spacing="8px">
                  <Icon as={FaFire} color="orange.400" boxSize="13px" />
                  <Text fontWeight="800" color={textColor}>
                    Prospectos calientes para hoy
                  </Text>
                </HStack>
                <Button size="xs" variant="ghost" color={muted} rightIcon={<Icon as={FaArrowRight} boxSize="9px" />} onClick={goToProspector} fontWeight="700">
                  Ver todos
                </Button>
              </Flex>

              {loading ? (
                <Box>
                  {[0, 1, 2].map((key) => (
                    <Skeleton key={key} height="52px" borderRadius="12px" mb="8px" />
                  ))}
                </Box>
              ) : hotLeads.length === 0 ? (
                <Flex direction="column" align="center" py="26px" gap="10px" textAlign="center">
                  <Icon as={FaRobot} boxSize="22px" color={muted} />
                  <Text fontSize="sm" color={muted} maxW="380px">
                    Aún no hay prospectos calientes. Lanza una extracción en tus grupos y el módulo los clasificará solo.
                  </Text>
                  <Button size="sm" variant="brand" leftIcon={<Icon as={FaPlay} boxSize="10px" />} onClick={() => navigate("/prospector-fb?nueva=1")}>
                    Nueva extracción
                  </Button>
                </Flex>
              ) : (
                <Box>
                  {hotLeads.map((lead) => (
                    <HotLeadRow key={lead._id} lead={lead} onOpen={openLead} muted={muted} textColor={textColor} />
                  ))}

                  <Flex
                    mt="10px"
                    pt="12px"
                    borderTop="1px solid"
                    borderColor={borderColor}
                    gap="8px"
                    wrap="wrap"
                    align="center"
                    justify="space-between"
                  >
                    <HStack spacing="6px" wrap="wrap">
                      {[
                        { label: "Oferta", value: stats?.bySection?.renta, scheme: "green" },
                        { label: "Demanda", value: stats?.bySection?.demanda, scheme: "blue" },
                        { label: "Roomies", value: stats?.bySection?.roomies, scheme: "purple" },
                      ].map((item) => (
                        <Badge
                          key={item.label}
                          colorScheme={item.scheme}
                          variant="subtle"
                          borderRadius="full"
                          px="10px"
                          py="3px"
                          fontSize="xs"
                          fontWeight="700"
                        >
                          {item.label}: {item.value || 0}
                        </Badge>
                      ))}
                    </HStack>
                    <Button size="xs" variant="ghost" color="brand.500" rightIcon={<Icon as={FaArrowRight} boxSize="9px" />} onClick={goToProspector} fontWeight="800">
                      Abrir bandeja
                    </Button>
                  </Flex>
                </Box>
              )}
            </Card>

            <Flex direction="column" gap="16px">
              <Card p="20px" border="1px solid" borderColor={borderColor}>
                <HStack spacing="8px" mb="10px">
                  <Icon as={FaHandshake} color="brand.500" boxSize="13px" />
                  <Text fontWeight="800" color={textColor}>
                    Cruces listos
                  </Text>
                </HStack>
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" color={textColor} lineHeight="1">
                  {stats?.matches || 0}
                </Text>
                <Text fontSize="xs" color={muted} mt="4px">
                  Clientes que buscan ↔ propiedades y cuartos disponibles
                </Text>
                <Button mt="12px" size="sm" variant="lightBrand" rightIcon={<Icon as={FaArrowRight} boxSize="9px" />} onClick={() => navigate("/prospector-fb")} fontWeight="700">
                  Revisar cruces
                </Button>
              </Card>

              <Card p="20px" border="1px solid" borderColor={borderColor}>
                <HStack spacing="8px" mb="6px">
                  <Icon as={FaClock} color="brand.500" boxSize="12px" />
                  <Text fontWeight="800" color={textColor}>
                    Actividad reciente
                  </Text>
                </HStack>
                {loading ? (
                  <Skeleton height="40px" borderRadius="10px" />
                ) : jobs.length === 0 ? (
                  <Text fontSize="xs" color={muted}>
                    Todavía no hay extracciones registradas.
                  </Text>
                ) : (
                  jobs.map((job) => <JobRow key={job._id} job={job} muted={muted} textColor={textColor} borderColor={borderColor} />)
                )}
              </Card>

              <Card p="20px" border="1px solid" borderColor={borderColor}>
                <HStack spacing="8px" mb="10px">
                  <Icon as={FaFacebookF} color="#1877F2" boxSize="12px" />
                  <Text fontWeight="800" color={textColor}>
                    Grupos monitoreados
                  </Text>
                </HStack>
                <Flex align="baseline" gap="6px">
                  <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" color={textColor} lineHeight="1">
                    {sectorInfo.groups}
                  </Text>
                  <Text fontSize="xs" color={muted} fontWeight="700">
                    grupos en {sectorInfo.total} sectores
                  </Text>
                </Flex>
                <Text fontSize="xs" color={muted} mt="4px">
                  Cada extracción trae publicaciones nuevas y descarta las repetidas.
                </Text>
                <Button mt="12px" size="sm" variant="ghost" justifyContent="space-between" rightIcon={<Icon as={FaArrowRight} boxSize="9px" />} onClick={goToProspector} bg={softBg} fontWeight="700" color={textColor} w="100%">
                  Gestionar grupos
                </Button>
              </Card>
            </Flex>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}
