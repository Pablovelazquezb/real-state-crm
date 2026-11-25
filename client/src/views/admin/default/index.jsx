import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
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
  FaBuilding,
  FaFire,
  FaHandshake,
  FaMapMarkerAlt,
  FaPlus,
  FaUserFriends,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";
import { getApi } from "services/api";
import { formatDate, scoreScheme } from "views/admin/facebookProspector/constants";

const toArray = (response) => {
  if (!response || response.status >= 400) return [];
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.user)) return payload.user;
  return [];
};

const money = (value) => {
  const number = Number(value);
  if (!number) return "—";
  if (number >= 1000000) return `$${(number / 1000000).toFixed(1)}M`;
  return `$${number.toLocaleString("es-MX")}`;
};

const initials = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "N";

const KpiCard = ({ label, value, hint, icon, tint, onClick, loading }) => {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.400", "whiteAlpha.100");

  return (
    <Card
      p="18px"
      border="1px solid"
      borderColor={borderColor}
      cursor={onClick ? "pointer" : "default"}
      transition="transform .16s ease, box-shadow .16s ease"
      _hover={onClick ? { transform: "translateY(-1px)", boxShadow: "0 14px 30px -24px rgba(15,23,42,.5)" } : undefined}
      onClick={onClick}
    >
      <Flex align="center" gap="12px">
        <Flex
          align="center"
          justify="center"
          w={{ base: "34px", md: "40px" }}
          h={{ base: "34px", md: "40px" }}
          borderRadius="12px"
          bg={tint}
          flexShrink={0}
        >
          <Icon as={icon} color="white" boxSize="16px" />
        </Flex>
        <Box minW="0">
          <Text
            fontSize={{ base: "9px", md: "11px" }}
            fontWeight="700"
            letterSpacing="0.04em"
            textTransform="uppercase"
            color={muted}
            noOfLines={2}
            lineHeight="1.25"
          >
            {label}
          </Text>
          <Text fontSize={{ base: "20px", md: "24px" }} fontWeight="800" lineHeight="1.1" color={textColor}>
            {loading ? "—" : value}
          </Text>
          <Text fontSize={{ base: "10px", md: "11px" }} color={muted} noOfLines={1}>
            {hint}
          </Text>
        </Box>
      </Flex>
    </Card>
  );
};

const LeadRow = ({ lead, muted, textColor, onClick, hoverBg }) => (
  <Flex
    align="center"
    justify="space-between"
    gap="10px"
    py="10px"
    px="8px"
    borderRadius="10px"
    cursor="pointer"
    _hover={{ bg: hoverBg }}
    onClick={onClick}
  >
    <HStack spacing="10px" minW="0">
      <Avatar size="xs" name={initials(lead.leadName || lead.name)} bg="brand.100" color="brand.700" fontWeight="800" />
      <Box minW="0">
        <Text fontSize="sm" fontWeight="700" color={textColor} noOfLines={1}>
          {lead.leadName || lead.name || "Sin nombre"}
        </Text>
        <Text fontSize="xs" color={muted} noOfLines={1}>
          {lead.leadSource || lead.leadStatus || "Lead"} · {formatDate(lead.createdDate || lead.created_at)}
        </Text>
      </Box>
    </HStack>
    <Icon as={FaArrowRight} boxSize="10px" color={muted} />
  </Flex>
);

const HotProspect = ({ lead, muted, textColor, borderColor, onOpen }) => (
  <Flex
    align="center"
    justify="space-between"
    gap="10px"
    py="10px"
    borderBottom="1px solid"
    borderColor={borderColor}
  >
    <Box minW="0" flex="1">
      <Text fontSize="sm" fontWeight="700" color={textColor} noOfLines={1}>
        {lead.userName}
      </Text>
      <Text fontSize="xs" color={muted} noOfLines={1}>
        {lead.zone} · <Text as="span" fontWeight="700" color={textColor}>{lead.priceDisplay}</Text>
      </Text>
    </Box>

    <HStack spacing="6px" flexShrink={0}>
      <Badge colorScheme={scoreScheme(lead.leadScore)} borderRadius="full" fontSize="10px" fontWeight="800">
        {lead.leadScore}
      </Badge>
      {lead.phone ? (
        <Tooltip label={lead.phone} hasArrow>
          <IconButton
            as="a"
            href={lead.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp ${lead.phone}`}
            icon={<Icon as={FaWhatsapp} boxSize="13px" />}
            size="xs"
            bg="#25D366"
            color="white"
            borderRadius="full"
            _hover={{ bg: "#1eb85a" }}
            w="28px"
            h="28px"
            minW="28px"
          />
        </Tooltip>
      ) : (
        <Button size="xs" variant="ghost" color={muted} onClick={onOpen}>
          Ver
        </Button>
      )}
    </HStack>
  </Flex>
);

export default function AdminSummary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [hotLeads, setHotLeads] = useState([]);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.400", "whiteAlpha.100");
  const softBg = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const hoverBg = useColorModeValue("secondaryGray.200", "whiteAlpha.100");
  const hoverSoftBg = useColorModeValue("secondaryGray.200", "whiteAlpha.200");

  const load = useCallback(async () => {
    setLoading(true);
    const [propertiesRes, leadsRes, contactsRes, statsRes, hotRes] = await Promise.all([
      getApi("api/property/"),
      getApi("api/lead/"),
      getApi("api/contact/"),
      getApi("api/facebook-scraper/stats"),
      getApi("api/facebook-scraper/leads?hotOnly=true&sort=score&limit=4"),
    ]);

    setProperties(toArray(propertiesRes));
    setLeads(toArray(leadsRes));
    setContacts(toArray(contactsRes));
    if (statsRes?.status === 200) setStats(statsRes.data);
    if (hotRes?.status === 200) setHotLeads(hotRes.data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Inicio · Nova CRM";
    load();
  }, [load]);

  const portfolioValue = properties.reduce((acc, property) => acc + (Number(property.price) || 0), 0);

  const kpis = [
    {
      label: "Propiedades",
      value: properties.length,
      hint: `${portfolioValue > 0 ? money(portfolioValue) : "Sin inventario"} en cartera`,
      icon: FaBuilding,
      tint: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      onClick: () => navigate("/properties"),
    },
    {
      label: "Leads",
      value: leads.length,
      hint: "Prospectos del CRM",
      icon: FaUserFriends,
      tint: "linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)",
      onClick: () => navigate("/lead"),
    },
    {
      label: "Contactos",
      value: contacts.length,
      hint: "Personas en tu base",
      icon: FaUsers,
      tint: "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)",
      onClick: () => navigate("/contacts"),
    },
    {
      label: "Prospectos FB",
      value: stats?.total || 0,
      hint: `${stats?.hot || 0} calientes`,
      icon: FaFire,
      tint: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
      onClick: () => navigate("/prospector-fb"),
    },
    {
      label: "Cruces",
      value: stats?.matches || 0,
      hint: "Demanda ↔ oferta",
      icon: FaHandshake,
      tint: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      onClick: () => navigate("/prospector-fb"),
    },
  ];

  const recentProperties = properties.slice(0, 4);
  const recentLeads = leads.slice(0, 5);

  return (
    <Box>
      {/* Encabezado */}
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap="14px" mb="20px" wrap="wrap">
        <Box>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color={textColor} lineHeight="1.2">
            Hola, {user?.firstName || "equipo"} 👋
          </Text>
          <Text fontSize="sm" color={muted}>
            Este es el pulso de tu cartera y tu prospección de hoy.
          </Text>
        </Box>
        <HStack spacing="8px" wrap="wrap">
          <Button size="sm" variant="lightBrand" leftIcon={<Icon as={FaPlus} boxSize="10px" />} onClick={() => navigate("/properties")}>
            Propiedad
          </Button>
          <Button size="sm" variant="lightBrand" leftIcon={<Icon as={FaPlus} boxSize="10px" />} onClick={() => navigate("/lead")}>
            Lead
          </Button>
          <Button size="sm" variant="brand" leftIcon={<Icon as={FaFire} boxSize="10px" />} onClick={() => navigate("/prospector-fb?nueva=1")}>
            Nueva extracción
          </Button>
        </HStack>
      </Flex>

      {/* KPIs */}
      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap="14px" mb="18px">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} loading={loading} />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} gap="16px" alignItems="start">
        {/* Últimos leads */}
        <Card p="20px" gridColumn={{ base: "auto", xl: "span 2" }}>
          <Flex justify="space-between" align="center" mb="8px" gap="10px" wrap="wrap">
            <HStack spacing="8px">
              <Icon as={FaUserFriends} boxSize="13px" color="brand.500" />
              <Text fontWeight="800" color={textColor}>
                Últimos leads
              </Text>
            </HStack>
            <Button size="xs" variant="ghost" color={muted} rightIcon={<Icon as={FaArrowRight} boxSize="9px" />} onClick={() => navigate("/lead")}>
              Ver todos
            </Button>
          </Flex>

          {loading ? (
            <Box>
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} height="46px" borderRadius="10px" mb="8px" />
              ))}
            </Box>
          ) : recentLeads.length === 0 ? (
            <Flex direction="column" align="center" py="26px" gap="8px" textAlign="center">
              <Text fontSize="sm" color={muted}>
                Aún no hay leads registrados. Crea el primero o envíalos desde el Prospector.
              </Text>
              <Button size="sm" variant="brand" onClick={() => navigate("/lead")}>
                Ir a Leads
              </Button>
            </Flex>
          ) : (
            <Flex direction="column">
              {recentLeads.map((lead, index) => (
                <LeadRow
                  key={lead._id || index}
                  lead={lead}
                  muted={muted}
                  textColor={textColor}
                  onClick={() => navigate(`/leadView/${lead._id}`)}
                  hoverBg={hoverBg}
                />
              ))}
            </Flex>
          )}

          <Box mt="16px" pt="14px" borderTop="1px solid" borderColor={borderColor}>
            <Flex justify="space-between" align="center" mb="8px">
              <HStack spacing="8px">
                <Icon as={FaBuilding} boxSize="12px" color="brand.500" />
                <Text fontSize="sm" fontWeight="800" color={textColor}>
                  Propiedades recientes
                </Text>
              </HStack>
              <Button size="xs" variant="ghost" color={muted} rightIcon={<Icon as={FaArrowRight} boxSize="9px" />} onClick={() => navigate("/properties")}>
                Ver todas
              </Button>
            </Flex>

            {loading ? (
              <Skeleton height="60px" borderRadius="10px" />
            ) : recentProperties.length === 0 ? (
              <Text fontSize="sm" color={muted}>
                Sin propiedades registradas todavía.
              </Text>
            ) : (
              <Wrap spacing="8px">
                {recentProperties.map((property) => (
                  <WrapItem key={property._id}>
                    <Flex
                      direction="column"
                      p="10px 12px"
                      borderRadius="10px"
                      bg={softBg}
                      minW="170px"
                      cursor="pointer"
                      _hover={{ bg: hoverSoftBg }}
                      onClick={() => navigate(`/propertyView/${property._id}`)}
                    >
                      <Text fontSize="sm" fontWeight="700" color={textColor} noOfLines={1}>
                        {property.propertyName || property.name || "Propiedad"}
                      </Text>
                      <Text fontSize="xs" color={muted} noOfLines={1}>
                        {property.location || "Sin ubicación"}
                      </Text>
                      <Text fontSize="sm" fontWeight="800" color="brand.600" mt="2px">
                        {money(property.price)}
                      </Text>
                    </Flex>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </Box>
        </Card>

        {/* Prospección */}
        <Flex direction="column" gap="16px">
          <Card p="20px">
            <Flex justify="space-between" align="center" mb="8px">
              <HStack spacing="8px">
                <Icon as={FaFire} boxSize="12px" color="orange.400" />
                <Text fontWeight="800" color={textColor}>
                  Prospectos calientes
                </Text>
              </HStack>
              <Button size="xs" variant="ghost" color={muted} rightIcon={<Icon as={FaArrowRight} boxSize="9px" />} onClick={() => navigate("/prospector-fb")}>
                Ver
              </Button>
            </Flex>

            {loading ? (
              <Skeleton height="80px" borderRadius="10px" />
            ) : hotLeads.length === 0 ? (
              <Text fontSize="sm" color={muted}>
                Sin prospectos calientes. Lanza una extracción de tus grupos.
              </Text>
            ) : (
              <Box>
                {hotLeads.map((lead) => (
                  <HotProspect
                    key={lead._id}
                    lead={lead}
                    muted={muted}
                    textColor={textColor}
                    borderColor={borderColor}
                    onOpen={() => navigate("/prospector-fb")}
                  />
                ))}
              </Box>
            )}
          </Card>

          <Card p="20px" bg="linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" color="white">
            <Text fontSize="sm" fontWeight="800">
              Prospector Facebook
            </Text>
            <Text fontSize="xs" color="whiteAlpha.800" mt="4px">
              {stats?.total || 0} prospectos detectados · {stats?.withPhone || 0} con WhatsApp
            </Text>
            <Button
              mt="12px"
              size="sm"
              bg="white"
              color="brand.700"
              _hover={{ bg: "whiteAlpha.900" }}
              rightIcon={<Icon as={FaArrowRight} boxSize="9px" />}
              onClick={() => navigate("/prospector-fb")}
              w="100%"
            >
              Abrir bandeja
            </Button>
          </Card>
        </Flex>
      </SimpleGrid>
    </Box>
  );
}
