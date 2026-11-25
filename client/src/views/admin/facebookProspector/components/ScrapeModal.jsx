import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Switch,
  Text,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { FaFacebookF, FaPlay, FaRobot } from "react-icons/fa";

const parseUrls = (text) =>
  String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export default function ScrapeModal({ isOpen, onClose, sectors, settings, initialSectorId, onStart, loading, activeJobs }) {
  const [mode, setMode] = useState("sector");
  const [sectorId, setSectorId] = useState("all");
  const [urlsText, setUrlsText] = useState("");
  const [limit, setLimit] = useState(40);
  const [aiEnrich, setAiEnrich] = useState(false);

  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const inputBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");

  useEffect(() => {
    if (!isOpen) return;

    setLimit(settings?.defaultResultsLimit || 40);
    setAiEnrich(Boolean(settings?.aiEnrichDefault && settings?.hasGeminiKey));

    if (initialSectorId) {
      setMode("sector");
      setSectorId(initialSectorId);
    } else {
      setMode("sector");
      setSectorId("all");
    }
    setUrlsText("");
  }, [isOpen, initialSectorId, settings]);

  const selectedSector = useMemo(
    () => (sectors || []).find((sector) => sector._id === sectorId || sector.sectorId === sectorId),
    [sectors, sectorId],
  );

  const totalGroups = useMemo(
    () => (sectors || []).reduce((acc, sector) => acc + (sector.urls?.length || 0), 0),
    [sectors],
  );

  const manualUrls = useMemo(() => parseUrls(urlsText), [urlsText]);

  const groupCount = mode === "manual" ? manualUrls.length : sectorId === "all" ? totalGroups : selectedSector?.urls?.length || 0;

  const estimated = groupCount * (Number(limit) || 0);

  const canStart =
    groupCount > 0 && Number(limit) > 0 && !loading && (mode !== "manual" || manualUrls.length > 0) && !activeJobs;

  const handleStart = () => {
    const payload = {
      resultsLimit: Number(limit) || 40,
      aiEnrich,
    };

    if (mode === "manual") {
      payload.urls = manualUrls;
    } else if (sectorId !== "all") {
      payload.sectorId = sectorId;
    }

    onStart(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="20px">
        <ModalHeader fontSize="lg">Nueva extracción de prospectos</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!settings?.hasApifyToken ? (
            <Alert status="warning" borderRadius="12px" mb="16px" fontSize="xs">
              <AlertIcon />
              <AlertDescription>
                Configura el token de Apify en la pestaña Ajustes antes de lanzar una extracción.
              </AlertDescription>
            </Alert>
          ) : null}

          {activeJobs ? (
            <Alert status="info" borderRadius="12px" mb="16px" fontSize="xs">
              <AlertIcon />
              <AlertDescription>Hay una extracción en proceso. Espera a que termine o cancélala en Actividad.</AlertDescription>
            </Alert>
          ) : null}

          <HStack spacing="8px" mb="16px">
            <Button
              size="sm"
              variant={mode === "sector" ? "brand" : "ghost"}
              onClick={() => setMode("sector")}
              leftIcon={<Icon as={FaFacebookF} boxSize="10px" />}
            >
              Por sector
            </Button>
            <Button size="sm" variant={mode === "manual" ? "brand" : "ghost"} onClick={() => setMode("manual")}>
              URLs manuales
            </Button>
          </HStack>

          {mode === "sector" ? (
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="700">
                Sector
              </FormLabel>
              <Select
                size="sm"
                value={sectorId}
                onChange={(event) => setSectorId(event.target.value)}
                borderRadius="10px"
                bg={inputBg}
                border="1px solid"
                borderColor={borderColor}
                _focus={{ borderColor: "brand.500", boxShadow: "none" }}
              >
                <option value="all">Todos los grupos configurados ({totalGroups})</option>
                {(sectors || []).map((sector) => (
                  <option key={sector._id} value={sector._id}>
                    {sector.name} ({sector.urls?.length || 0})
                  </option>
                ))}
              </Select>
              <FormHelperText fontSize="10px">
                {selectedSector?.description || "Se recorrerán todos los grupos activos del módulo."}
              </FormHelperText>
            </FormControl>
          ) : (
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="700">
                URLs de grupos de Facebook
              </FormLabel>
              <Textarea
                value={urlsText}
                onChange={(event) => setUrlsText(event.target.value)}
                placeholder={"https://www.facebook.com/groups/4997307006973319/\nhttps://www.facebook.com/groups/RentasMonterrey/"}
                rows={5}
                fontSize="xs"
                borderRadius="10px"
                bg={inputBg}
                border="1px solid"
                borderColor={borderColor}
                _focus={{ borderColor: "brand.500", boxShadow: "none" }}
              />
              <FormHelperText fontSize="10px">Una URL por línea. También acepta el ID numérico del grupo.</FormHelperText>
            </FormControl>
          )}

          <Flex gap="14px" mt="16px" wrap="wrap">
            <FormControl maxW={{ base: "100%", md: "200px" }}>
              <FormLabel fontSize="sm" fontWeight="700">
                Publicaciones por grupo
              </FormLabel>
              <Input
                type="number"
                min={1}
                max={500}
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                size="sm"
                borderRadius="10px"
                bg={inputBg}
                border="1px solid"
                borderColor={borderColor}
                _focus={{ borderColor: "brand.500", boxShadow: "none" }}
              />
            </FormControl>

            <Flex
              flex="1"
              minW="220px"
              align="center"
              justify="space-between"
              gap="12px"
              p="12px"
              borderRadius="12px"
              bg={inputBg}
            >
              <Flex direction="column">
                <HStack spacing="6px">
                  <Icon as={FaRobot} boxSize="11px" color="brand.500" />
                  <Text fontSize="sm" fontWeight="700" color={textColor}>
                    Enriquecer con IA
                  </Text>
                </HStack>
                <Text fontSize="10px" color={muted}>
                  {settings?.hasGeminiKey ? "Resúmenes y detección de teléfonos con Gemini." : "Requiere llave de Gemini en Ajustes."}
                </Text>
              </Flex>
              <Switch
                colorScheme="brand"
                isChecked={aiEnrich}
                isDisabled={!settings?.hasGeminiKey}
                onChange={(event) => setAiEnrich(event.target.checked)}
              />
            </Flex>
          </Flex>

          <Flex mt="16px" p="12px" borderRadius="12px" border="1px dashed" borderColor={borderColor} justify="space-between" wrap="wrap" gap="8px">
            <HStack spacing="6px" fontSize="xs" color={muted} fontWeight="600">
              <Icon as={FaFacebookF} boxSize="10px" color="#1877F2" />
              <Text fontSize="xs" fontWeight="600" color={muted}>
                {groupCount} grupo{groupCount === 1 ? "" : "s"} seleccionado{groupCount === 1 ? "" : "s"}
              </Text>
            </HStack>
            <Badge colorScheme="brand" variant="subtle" borderRadius="full" px="10px">
              Hasta {estimated} publicaciones
            </Badge>
          </Flex>
        </ModalBody>

        <ModalFooter gap="8px">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" variant="brand" leftIcon={<Icon as={FaPlay} boxSize="10px" />} onClick={handleStart} isLoading={loading} isDisabled={!canStart}>
            Iniciar extracción
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
