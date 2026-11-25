import {
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
import React from "react";
import {
  FaArrowRight,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUserFriends,
  FaWhatsapp,
} from "react-icons/fa";

const Panel = ({ lead, kind, muted, textColor, borderColor }) => {
  const isDemand = kind === "demand";
  const softBg = useColorModeValue(
    isDemand ? "#eef2ff" : "#ecfdf5",
    isDemand ? "rgba(67, 56, 202, 0.16)" : "rgba(16, 185, 129, 0.14)",
  );

  return (
    <Box bg={softBg} borderRadius="14px" p="14px" border="1px solid" borderColor={borderColor}>
      <Text fontSize="10px" fontWeight="800" letterSpacing="0.06em" textTransform="uppercase" color={isDemand ? "brand.500" : "green.500"}>
        {isDemand ? "Quien busca" : "Oferta disponible"}
      </Text>
      <Text mt="4px" fontSize="sm" fontWeight="800" color={textColor} noOfLines={1}>
        {lead.userName || "Contacto Facebook"}
      </Text>
      <Text fontSize="xs" color={muted} noOfLines={1}>
        {lead.roleLabel || lead.propertyType}
      </Text>
      <HStack mt="8px" spacing="6px" color={muted} fontSize="xs" fontWeight="600">
        <Icon as={FaMapMarkerAlt} boxSize="9px" />
        <Text noOfLines={1}>{lead.zone || "Zona sin definir"}</Text>
      </HStack>
      <Text mt="6px" fontSize="sm" fontWeight="800" color={textColor}>
        {isDemand ? "Presupuesto: " : "Precio: "}
        {lead.priceDisplay || "A convenir"}
      </Text>
      <HStack mt="4px" spacing="6px" color={muted} fontSize="xs">
        <Icon as={FaPhoneAlt} boxSize="9px" />
        <Text>{lead.phone || "Sin teléfono (contactar en Facebook)"}</Text>
      </HStack>
    </Box>
  );
};

export default function MatchList({ matches, loading, target, onClearTarget, onOpenLead }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const trackBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  if (loading) {
    return (
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="16px">
        {[0, 1, 2, 3].map((key) => (
          <Card key={key} p="20px">
            <Skeleton height="18px" width="40%" borderRadius="6px" />
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px" mt="16px">
              <Skeleton height="120px" borderRadius="14px" />
              <Skeleton height="120px" borderRadius="14px" />
            </SimpleGrid>
          </Card>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <>
      {target ? (
        <Card p="14px" mb="16px" bg="linear-gradient(90deg, rgba(67,56,202,0.10) 0%, rgba(255,255,255,0) 100%)">
          <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
            <HStack spacing="10px">
              <Icon as={FaUserFriends} color="brand.500" />
              <Text fontSize="sm" fontWeight="700" color={textColor}>
                Cruces para {target.userName}
              </Text>
              <Badge colorScheme="brand" borderRadius="full">
                {target.zone}
              </Badge>
            </HStack>
            <Button size="sm" variant="ghost" onClick={onClearTarget} fontWeight="600">
              Ver todos los cruces
            </Button>
          </Flex>
        </Card>
      ) : null}

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="16px">
        {matches.map((match, index) => (
          <Card key={`${match.demand._id}-${match.supply._id}-${index}`} p="20px" border="1px solid" borderColor={borderColor}>
            <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
              <HStack spacing="8px">
                <Badge colorScheme={match.isRoomie ? "purple" : "brand"} borderRadius="full" px="10px" py="3px" fontWeight="700">
                  {match.isRoomie ? "Roomies" : "Inmueble"}
                </Badge>
                <Badge colorScheme="green" variant="subtle" borderRadius="full" px="10px" py="3px" fontWeight="800">
                  {match.score}% de coincidencia
                </Badge>
              </HStack>
              <Tooltip label="Se calcula con zona, presupuesto y preferencias" hasArrow>
                <HStack spacing="3px" aria-label={`${match.score} por ciento de coincidencia`}>
                  {[20, 40, 60, 80, 100].map((step) => (
                    <Box
                      key={step}
                      h="6px"
                      w="20px"
                      borderRadius="full"
                      bg={match.score >= step ? "green.400" : trackBg}
                    />
                  ))}
                </HStack>
              </Tooltip>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: "10px", md: "12px" }} mt="14px" alignItems="center">
              <Panel lead={match.demand} kind="demand" muted={muted} textColor={textColor} borderColor={borderColor} />
              <Box display={{ base: "none", md: "flex" }} align="center" justify="center" position="relative">
                <Icon as={FaArrowRight} color={muted} boxSize="16px" />
              </Box>
              <Box display={{ base: "flex", md: "none" }} justify="center">
                <Icon as={FaArrowRight} color={muted} boxSize="14px" transform="rotate(90deg)" />
              </Box>
              <Panel lead={match.supply} kind="supply" muted={muted} textColor={textColor} borderColor={borderColor} />
            </SimpleGrid>

            {match.reasons?.length ? (
              <Wrap spacing="6px" mt="12px">
                {match.reasons.map((reason) => (
                  <WrapItem key={reason}>
                    <Badge variant="subtle" colorScheme="gray" borderRadius="full" px="8px" py="2px" fontWeight="600" textTransform="none">
                      ✓ {reason}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            ) : null}

            <Flex mt="14px" gap="8px" wrap="wrap">
              <Button
                as="a"
                href={match.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                size="sm"
                bg="#25D366"
                color="white"
                leftIcon={<Icon as={FaWhatsapp} />}
                _hover={{ bg: "#1eb85a" }}
                fontWeight="700"
              >
                {match.targetPhone ? `Presentar por WhatsApp (${match.targetPhone})` : "Enviar propuesta por WhatsApp"}
              </Button>
              <Button
                as="a"
                href={match.supply.url || "#"}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="ghost"
                color={muted}
                leftIcon={<Icon as={FaExternalLinkAlt} boxSize="10px" />}
                fontWeight="600"
              >
                Ver anuncio
              </Button>
              {onOpenLead ? (
                <Button size="sm" variant="ghost" color={muted} fontWeight="600" onClick={() => onOpenLead(match.supply)}>
                  Ver ficha
                </Button>
              ) : null}
            </Flex>
          </Card>
        ))}
      </SimpleGrid>
    </>
  );
}
