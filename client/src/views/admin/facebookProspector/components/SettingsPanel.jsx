import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  SimpleGrid,
  Switch,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaCloud,
  FaDatabase,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaRobot,
  FaSyncAlt,
  FaTimesCircle,
  FaUpload,
  FaWhatsapp,
} from "react-icons/fa";

const HealthBadge = ({ ok, label, message }) => (
  <Flex
    align="center"
    gap="6px"
    px="10px"
    py="6px"
    borderRadius="10px"
    bg={ok ? "green.50" : "red.50"}
    color={ok ? "green.600" : "red.500"}
    fontSize="xs"
    fontWeight="700"
    minW="0"
  >
    <Icon as={ok ? FaCheckCircle : FaTimesCircle} boxSize="10px" flexShrink={0} />
    <Text noOfLines={1} title={message}>
      {label}
    </Text>
  </Flex>
);

export default function SettingsPanel({
  settings,
  health,
  healthLoading,
  saving,
  importing,
  exporting,
  onSave,
  onCheckHealth,
  onImportSeed,
  onExport,
  stats,
}) {
  const [apifyToken, setApifyToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [limit, setLimit] = useState(40);
  const [aiDefault, setAiDefault] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [showApify, setShowApify] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const inputBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");

  useEffect(() => {
    if (!settings) return;
    setLimit(settings.defaultResultsLimit || 40);
    setAiDefault(Boolean(settings.aiEnrichDefault));
    setPageSize(settings.pageSize || 12);
  }, [settings]);

  const handleSaveCredentials = () => {
    const payload = {};
    if (apifyToken.trim()) payload.apifyToken = apifyToken.trim();
    if (geminiKey.trim()) payload.geminiKey = geminiKey.trim();
    if (Object.keys(payload).length === 0) return;
    onSave(payload, () => {
      setApifyToken("");
      setGeminiKey("");
    });
  };

  const handleSavePreferences = () => {
    onSave({ defaultResultsLimit: Number(limit) || 40, aiEnrichDefault: aiDefault, pageSize: Number(pageSize) || 12 });
  };

  const report = health?.report;

  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap="16px">
      <Card p="20px" border="1px solid" borderColor={borderColor}>
        <HStack spacing="8px" mb="4px">
          <Icon as={FaKey} color="brand.500" boxSize="13px" />
          <Text fontWeight="800" color={textColor}>
            Credenciales
          </Text>
        </HStack>
        <Text fontSize="xs" color={muted} mb="16px">
          Guarda el token de Apify y la llave de Gemini en el servidor. Nunca se envían completos al navegador.
        </Text>

        {report && !report?.apify?.ok ? (
          <Alert status="error" borderRadius="12px" mb="16px" fontSize="xs">
            <AlertIcon />
            <AlertDescription>
              {report.apify.message}. Revisa tu token en apify.com → Settings → Integrations y pégalo aquí.
            </AlertDescription>
          </Alert>
        ) : null}

        <FormControl mb="14px">
          <FormLabel fontSize="sm" fontWeight="700">
            Token de Apify
            {settings?.hasApifyToken ? (
              <Badge ml="8px" colorScheme="green" variant="subtle" borderRadius="full" fontSize="10px">
                {settings.apifyTokenSource === "env" ? "desde .env" : "guardado"}
              </Badge>
            ) : (
              <Badge ml="8px" colorScheme="orange" variant="subtle" borderRadius="full" fontSize="10px">
                sin configurar
              </Badge>
            )}
          </FormLabel>
          <InputGroup size="sm">
            <Input
              type={showApify ? "text" : "password"}
              value={apifyToken}
              onChange={(event) => setApifyToken(event.target.value)}
              placeholder={settings?.apifyTokenMasked || "apify_api_..."}
              borderRadius="10px"
              bg={inputBg}
              border="1px solid"
              borderColor={borderColor}
              _focus={{ borderColor: "brand.500", boxShadow: "none" }}
            />
            <InputRightElement h="full">
              <Icon
                as={showApify ? FaEyeSlash : FaEye}
                color={muted}
                cursor="pointer"
                onClick={() => setShowApify((prev) => !prev)}
                boxSize="11px"
              />
            </InputRightElement>
          </InputGroup>
          <FormHelperText fontSize="10px">
            Se obtiene en apify.com → Settings → Integrations. El scraper de grupos requiere créditos de Apify.
          </FormHelperText>
        </FormControl>

        <FormControl mb="16px">
          <FormLabel fontSize="sm" fontWeight="700">
            Llave de Google Gemini (opcional)
            {settings?.hasGeminiKey ? (
              <Badge ml="8px" colorScheme="green" variant="subtle" borderRadius="full" fontSize="10px">
                guardada
              </Badge>
            ) : null}
          </FormLabel>
          <InputGroup size="sm">
            <Input
              type={showGemini ? "text" : "password"}
              value={geminiKey}
              onChange={(event) => setGeminiKey(event.target.value)}
              placeholder={settings?.geminiKeyMasked || "AIza..."}
              borderRadius="10px"
              bg={inputBg}
              border="1px solid"
              borderColor={borderColor}
              _focus={{ borderColor: "brand.500", boxShadow: "none" }}
            />
            <InputRightElement h="full">
              <Icon
                as={showGemini ? FaEyeSlash : FaEye}
                color={muted}
                cursor="pointer"
                onClick={() => setShowGemini((prev) => !prev)}
                boxSize="11px"
              />
            </InputRightElement>
          </InputGroup>
          <FormHelperText fontSize="10px">
            Con IA se reescribe el resumen, se corrige la intención y se detectan teléfonos que no aparecían.
          </FormHelperText>
        </FormControl>

        <Flex gap="8px" wrap="wrap">
          <Button size="sm" variant="brand" onClick={handleSaveCredentials} isLoading={saving} isDisabled={!apifyToken.trim() && !geminiKey.trim()}>
            Guardar credenciales
          </Button>
          <Button size="sm" variant="ghost" leftIcon={<Icon as={FaSyncAlt} boxSize="10px" />} onClick={onCheckHealth} isLoading={healthLoading}>
            Verificar conexiones
          </Button>
        </Flex>

        <Divider my="16px" borderColor={borderColor} />

        <SimpleGrid columns={{ base: 2, md: 4 }} gap="8px">
          <HealthBadge ok={report?.apify?.ok} label="Apify" message={report?.apify?.message} />
          <HealthBadge ok={report?.gemini?.ok} label="Gemini" message={report?.gemini?.message} />
          <HealthBadge ok={report?.supabase?.ok} label="Supabase" message={report?.supabase?.message} />
          <HealthBadge ok={report?.mongo?.ok} label="Base local" message={report?.mongo?.message} />
        </SimpleGrid>
        {!report ? (
          <Text fontSize="10px" color={muted} mt="8px">
            Ejecuta "Verificar conexiones" para revisar el estado del módulo.
          </Text>
        ) : null}
      </Card>

      <Card p="20px" border="1px solid" borderColor={borderColor}>
        <HStack spacing="8px" mb="4px">
          <Icon as={FaRobot} color="brand.500" boxSize="13px" />
          <Text fontWeight="800" color={textColor}>
            Preferencias de extracción
          </Text>
        </HStack>
        <Text fontSize="xs" color={muted} mb="16px">
          Valores sugeridos para cada nueva extracción. Se pueden ajustar al lanzarla.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
          <FormControl>
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
            <FormHelperText fontSize="10px">Cada publicación consumida tiene costo en Apify.</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="700">
              Prospectos por página
            </FormLabel>
            <Select
              size="sm"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              borderRadius="10px"
              bg={inputBg}
              border="1px solid"
              borderColor={borderColor}
              _focus={{ borderColor: "brand.500", boxShadow: "none" }}
            >
              {[12, 18, 24, 36].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <FormHelperText fontSize="10px">Se guarda en este navegador; el módulo respeta el límite del servidor.</FormHelperText>
          </FormControl>
        </SimpleGrid>

        <Flex align="center" justify="space-between" gap="12px" mt="16px" p="12px" borderRadius="12px" bg={inputBg}>
          <BoxText muted={muted} textColor={textColor} />
          <Switch colorScheme="brand" isChecked={aiDefault} onChange={(event) => setAiDefault(event.target.checked)} />
        </Flex>

        <Button size="sm" variant="brand" mt="16px" onClick={handleSavePreferences} isLoading={saving}>
          Guardar preferencias
        </Button>

        <Divider my="18px" borderColor={borderColor} />

        <HStack spacing="8px" mb="10px">
          <Icon as={FaDatabase} color="brand.500" boxSize="12px" />
          <Text fontSize="sm" fontWeight="800" color={textColor}>
            Datos del módulo
          </Text>
        </HStack>
        <Text fontSize="xs" color={muted} mb="12px">
          {stats?.total || 0} prospectos · {stats?.converted || 0} enviados al CRM · {stats?.withPhone || 0} con WhatsApp.
        </Text>
        <Flex gap="8px" wrap="wrap">
          <Button
            size="sm"
            variant="lightBrand"
            leftIcon={<Icon as={FaUpload} boxSize="10px" />}
            onClick={onImportSeed}
            isLoading={importing}
          >
            Importar catálogo histórico
          </Button>
          <Button size="sm" variant="ghost" leftIcon={<Icon as={FaDownload} boxSize="10px" />} onClick={() => onExport("csv")} isLoading={exporting}>
            Exportar todo (CSV)
          </Button>
        </Flex>

        <Flex mt="16px" gap="8px" align="flex-start" p="12px" borderRadius="12px" bg="brand.50" color="brand.700">
          <Icon as={FaCloud} boxSize="12px" mt="3px" flexShrink={0} />
          <Text fontSize="xs" fontWeight="600">
            Los prospectos se guardan en la base local del servidor y el envío al CRM crea un Lead en Supabase. El
            catálogo histórico viene del scraper original (46 publicaciones reales de Monterrey).
          </Text>
        </Flex>
      </Card>

      <Card p="20px" border="1px solid" borderColor={borderColor} gridColumn={{ base: "auto", xl: "span 2" }}>
        <HStack spacing="8px" mb="12px">
          <Icon as={FaWhatsapp} color="#25D366" boxSize="14px" />
          <Text fontWeight="800" color={textColor}>
            Cómo trabaja el Prospector
          </Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="12px">
          {[
            { title: "1. Extrae", text: "Apify recorre los grupos configurados y descarga las publicaciones más recientes." },
            { title: "2. Clasifica", text: "Se detecta rol (renta, demanda, roomie), zona, precio, teléfono y calidad del prospecto." },
            { title: "3. Cruza", text: "El matchmaker empareja clientes que buscan con propiedades o cuartos disponibles." },
            { title: "4. Contacta", text: "Mensajes de WhatsApp listos por perfil y envío del prospecto al módulo de Leads." },
          ].map((step) => (
            <Flex direction="column" gap="4px" p="12px" borderRadius="12px" bg={inputBg} key={step.title}>
              <Text fontSize="xs" fontWeight="800" color="brand.500">
                {step.title}
              </Text>
              <Text fontSize="xs" color={muted}>
                {step.text}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>
      </Card>
    </SimpleGrid>
  );
}

const BoxText = ({ muted, textColor }) => (
  <Flex direction="column">
    <Text fontSize="sm" fontWeight="700" color={textColor}>
      Enriquecer con IA por defecto
    </Text>
    <Text fontSize="xs" color={muted}>
      Usa Gemini en cada extracción nueva (consume cuota de la API).
    </Text>
  </Flex>
);
