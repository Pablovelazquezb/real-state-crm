import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Tag,
  Text,
  Tooltip,
  useColorModeValue,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useMemo, useState } from "react";
import {
  FaEllipsisV,
  FaExternalLinkAlt,
  FaHandshake,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRegStar,
  FaTrash,
  FaUserPlus,
  FaWhatsapp,
} from "react-icons/fa";
import { STATUS_OPTIONS, formatDate, roleOf, scoreScheme, sectionOf, statusOf } from "../constants";

const ScorePill = ({ score }) => (
  <Tooltip label="Calidad del prospecto (0 a 100)" hasArrow>
    <Badge
      colorScheme={scoreScheme(score)}
      borderRadius="full"
      px="10px"
      py="4px"
      fontSize="xs"
      fontWeight="800"
      textTransform="none"
    >
      {score} pts
    </Badge>
  </Tooltip>
);

const StatusMenu = ({ lead, onStatus, onConvert, onDelete, onMatches, busy }) => {
  const current = statusOf(lead.status);

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        size="sm"
        variant="lightBrand"
        rightIcon={<Icon as={FaEllipsisV} boxSize="10px" />}
        isDisabled={busy}
        fontWeight="600"
      >
        {current.label}
      </MenuButton>
      <MenuList minW="190px" fontSize="sm" zIndex="popover">
        {STATUS_OPTIONS.map((status) => (
          <MenuItem
            key={status.value}
            onClick={() => onStatus(lead, status.value)}
            isDisabled={lead.status === status.value}
            icon={<Badge colorScheme={status.scheme} borderRadius="full" boxSize="8px" p="0" />}
          >
            {status.label}
          </MenuItem>
        ))}
        <MenuDivider />
        <MenuItem icon={<Icon as={FaUserPlus} />} onClick={() => onConvert(lead)} isDisabled={Boolean(lead.convertedLeadId)}>
          {lead.convertedLeadId ? "Ya está en el CRM" : "Enviar al CRM"}
        </MenuItem>
        <MenuItem icon={<Icon as={FaHandshake} />} onClick={() => onMatches(lead)}>
          Buscar cruces
        </MenuItem>
        <MenuItem icon={<Icon as={FaTrash} />} color="red.500" onClick={() => onDelete(lead)}>
          Eliminar prospecto
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default function LeadCard({ lead, onStatus, onConvert, onDelete, onMatches, busy }) {
  const [expanded, setExpanded] = useState(false);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const softBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  const role = roleOf(lead.role);
  const section = sectionOf(lead.section);
  const isHot = String(lead.urgency || "").includes("Alta");

  // El resumen suele ser el inicio del texto: solo se muestra si aporta algo distinto.
  const summaryText = String(lead.aiSummary || "").replace(/(\.\.\.|…)$/, "").trim();
  const normalizedText = String(lead.text || "").replace(/\s+/g, " ").trim().toLowerCase();
  const summaryIsUseful =
    summaryText.length > 0 && !normalizedText.startsWith(summaryText.slice(0, 45).toLowerCase());
  const canExpand = String(lead.text || "").length > 190;

  const roomieChips = useMemo(() => {
    if (!String(lead.role || "").startsWith("roomie")) return [];
    const prefs = lead.roomiePrefs || {};
    return [prefs.gender, prefs.profile, prefs.pets, prefs.services].filter(
      (value) => value && value !== "No especificado" && value !== "Consultar",
    );
  }, [lead.role, lead.roomiePrefs]);

  return (
    <Card
      p="20px"
      border="1px solid"
      borderColor={borderColor}
      transition="box-shadow .18s ease, transform .18s ease"
      _hover={{ boxShadow: "0 18px 40px -28px rgba(15, 23, 42, 0.55)", transform: "translateY(-1px)" }}
    >
      <Flex justify="space-between" align="start" gap="12px">
        <Wrap spacing="6px" shouldWrapChildren>
          <WrapItem>
            <Badge colorScheme={role.scheme} borderRadius="full" px="10px" py="3px" fontWeight="700">
              {role.label}
            </Badge>
          </WrapItem>
          <WrapItem>
            <Tag size="sm" borderRadius="full" variant="subtle" colorScheme={section.scheme} fontWeight="600">
              {lead.propertyType || "Inmueble"}
            </Tag>
          </WrapItem>
          <WrapItem>
            <Tag size="sm" borderRadius="full" variant="outline" color={muted} fontWeight="600">
              <Icon as={FaMapMarkerAlt} boxSize="9px" mr="4px" />
              {lead.zone || "Zona sin definir"}
            </Tag>
          </WrapItem>
          {isHot ? (
            <WrapItem>
              <Badge colorScheme="red" borderRadius="full" px="8px" py="3px" fontWeight="700">
                🔥 Urgente
              </Badge>
            </WrapItem>
          ) : null}
        </Wrap>
        <ScorePill score={lead.leadScore || 0} />
      </Flex>

      <Text mt="12px" fontSize="md" fontWeight="800" color={textColor} noOfLines={1}>
        {lead.userName || "Contacto Facebook"}
      </Text>
      <Text fontSize="xs" color={muted} noOfLines={1}>
        {lead.groupName || "Grupo de Facebook"} · {formatDate(lead.postedAt || lead.createdAt) || lead.dateStr}
      </Text>

      {summaryIsUseful ? (
        <Text mt="10px" fontSize="sm" fontWeight="600" color={textColor} noOfLines={2}>
          {summaryText}
        </Text>
      ) : null}

      <Text mt="8px" fontSize="sm" color={muted} noOfLines={expanded ? undefined : 3} whiteSpace="pre-line">
        {lead.text || "Publicación sin descripción."}
      </Text>

      {canExpand ? (
        <Button
          variant="link"
          size="xs"
          mt="4px"
          color="brand.500"
          fontWeight="700"
          alignSelf="flex-start"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </Button>
      ) : null}

      {roomieChips.length > 0 ? (
        <HStack mt="10px" spacing="6px" wrap="wrap">
          {roomieChips.map((chip) => (
            <Tag key={chip} size="sm" borderRadius="full" bg={softBg} color={textColor} fontWeight="600">
              {chip}
            </Tag>
          ))}
        </HStack>
      ) : null}

      <Flex mt="16px" align="flex-end" justify="space-between" gap="12px" wrap="wrap">
        <BoxPrice lead={lead} muted={muted} textColor={textColor} />
        {lead.phone ? (
          <HStack spacing="6px" color={muted} fontSize="xs" fontWeight="600">
            <Icon as={FaPhoneAlt} boxSize="10px" />
            <Text>{lead.phone}</Text>
          </HStack>
        ) : (
          <Text fontSize="xs" color={muted} fontStyle="italic">
            Sin teléfono detectado
          </Text>
        )}
      </Flex>

      <Divider my="14px" borderColor={borderColor} />

      <Flex align="center" gap="8px" wrap="wrap">
        <Tooltip label={lead.phone ? "Abrir WhatsApp con mensaje listo" : "Sin teléfono detectado en la publicación"} hasArrow>
          <Box as="span" display="inline-flex">
            <Button
            as={lead.phone ? "a" : "button"}
            href={lead.phone ? lead.whatsappUrl : undefined}
            target={lead.phone ? "_blank" : undefined}
            rel="noreferrer"
            size="sm"
            bg="#25D366"
            color="white"
            leftIcon={<Icon as={FaWhatsapp} />}
            isDisabled={!lead.phone}
            _hover={{ bg: "#1eb85a" }}
            fontWeight="700"
          >
            WhatsApp
            </Button>
          </Box>
        </Tooltip>
        <Button
          as="a"
          href={lead.url || "#"}
          target="_blank"
          rel="noreferrer"
          size="sm"
          variant="ghost"
          leftIcon={<Icon as={FaExternalLinkAlt} />}
          color={muted}
          fontWeight="600"
        >
          Ver anuncio
        </Button>
        <Tooltip label="Ver cruces compatibles" hasArrow>
          <IconButton
            aria-label="Buscar cruces"
            icon={<Icon as={FaHandshake} />}
            size="sm"
            variant="ghost"
            color={muted}
            onClick={() => onMatches(lead)}
          />
        </Tooltip>
        <Flex flex="1" />
        <StatusMenu lead={lead} onStatus={onStatus} onConvert={onConvert} onDelete={onDelete} onMatches={onMatches} busy={busy} />
      </Flex>

      {lead.status === "convertido" && lead.convertedLeadId ? (
        <Flex mt="10px" align="center" gap="6px" fontSize="xs" color="green.500" fontWeight="700">
          <Icon as={FaRegStar} boxSize="10px" />
          Enviado al módulo de Leads del CRM
        </Flex>
      ) : null}
    </Card>
  );
}

const BoxPrice = ({ lead, muted, textColor }) => (
  <div>
    <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.04em" color={muted}>
      {String(lead.role || "").startsWith("demand") ? "Presupuesto" : "Precio"}
    </Text>
    <Text fontSize="lg" fontWeight="800" color={textColor} lineHeight="1.2">
      {lead.priceDisplay || "A convenir"}
    </Text>
  </div>
);
