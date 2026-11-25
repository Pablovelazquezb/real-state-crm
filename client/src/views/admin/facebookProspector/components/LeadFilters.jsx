import {
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Switch,
  Text,
  Tooltip,
  useColorModeValue,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React from "react";
import { FaChevronDown, FaDownload, FaSearch, FaSyncAlt, FaTimes } from "react-icons/fa";
import { POSTER_OPTIONS, SECTION_TABS, SORT_OPTIONS, STATUS_OPTIONS } from "../constants";

const SectionPills = ({ value, onChange, countBySection }) => {
  const activeBg = useColorModeValue("brand.500", "brand.400");
  const idleBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const idleColor = useColorModeValue("secondaryGray.700", "secondaryGray.400");

  return (
    <HStack spacing="6px" wrap="wrap">
      {SECTION_TABS.map((tab) => {
        const isActive = value === tab.value;
        const count = countBySection?.[tab.value];

        return (
          <Button
            key={tab.value}
            size="sm"
            h="34px"
            px="14px"
            borderRadius="full"
            bg={isActive ? activeBg : idleBg}
            color={isActive ? "white" : idleColor}
            fontWeight="700"
            fontSize="sm"
            onClick={() => onChange(tab.value)}
            _hover={{ bg: isActive ? activeBg : idleBg, opacity: isActive ? 1 : 0.85 }}
          >
            {tab.label}
            {typeof count === "number" ? (
              <Text as="span" ml="6px" fontWeight="700" opacity={0.75}>
                {count}
              </Text>
            ) : null}
          </Button>
        );
      })}
    </HStack>
  );
};

export default function LeadFilters({
  filters,
  onChange,
  onReset,
  zones = [],
  total = 0,
  loading,
  onRefresh,
  onExport,
  exporting,
}) {
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const inputBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const selectColor = useColorModeValue("secondaryGray.700", "secondaryGray.400");

  const countBySection = {
    all: total,
  };

  const selectProps = {
    size: "sm",
    h: "34px",
    borderRadius: "10px",
    bg: inputBg,
    border: "1px solid",
    borderColor,
    fontSize: "sm",
    fontWeight: "600",
    color: selectColor,
    maxW: { base: "100%", md: "200px" },
    _focus: { borderColor: "brand.500", boxShadow: "none" },
  };

  return (
    <Card p="16px">
      <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
        <SectionPills value={filters.section} onChange={(section) => onChange({ section })} countBySection={countBySection} />

        <HStack spacing="8px" flex={{ base: "1", md: "0 0 auto" }} w={{ base: "100%", md: "auto" }} wrap="wrap" justify={{ base: "space-between", md: "flex-end" }}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none" h="34px">
              <Icon as={FaSearch} color={muted} boxSize="12px" />
            </InputLeftElement>
            <Input
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Buscar nombre, zona, texto o teléfono"
              h="34px"
              borderRadius="10px"
              bg={inputBg}
              border="1px solid"
              borderColor={borderColor}
              fontSize="sm"
              _focus={{ borderColor: "brand.500", boxShadow: "none" }}
              w={{ base: "100%", md: "280px" }}
              minW="0"
            />
            {filters.search ? (
              <InputRightElement h="34px">
                <IconButton
                  aria-label="Limpiar búsqueda"
                  size="xs"
                  variant="ghost"
                  icon={<Icon as={FaTimes} />}
                  onClick={() => onChange({ search: "" })}
                />
              </InputRightElement>
            ) : null}
          </InputGroup>

          <Tooltip label="Actualizar" hasArrow>
            <IconButton
              aria-label="Actualizar prospectos"
              icon={<Icon as={FaSyncAlt} />}
              size="sm"
              h="34px"
              w="34px"
              borderRadius="10px"
              variant="ghost"
              color={muted}
              isLoading={loading}
              onClick={onRefresh}
            />
          </Tooltip>

          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              size="sm"
              h="34px"
              borderRadius="10px"
              variant="lightBrand"
              leftIcon={<Icon as={FaDownload} boxSize="11px" />}
              rightIcon={<Icon as={FaChevronDown} boxSize="9px" />}
              isLoading={exporting}
              fontWeight="700"
            >
              Exportar
            </MenuButton>
            <MenuList fontSize="sm" minW="180px">
              <MenuItem onClick={() => onExport("csv")}>Descargar CSV</MenuItem>
              <MenuItem onClick={() => onExport("json")}>Descargar JSON</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <Wrap spacing="10px" mt="14px" align="center">
        <WrapItem>
          <Select
            {...selectProps}
            value={filters.zone}
            onChange={(event) => onChange({ zone: event.target.value })}
            aria-label="Filtrar por zona"
          >
            <option value="all">Todas las zonas</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </Select>
        </WrapItem>

        <WrapItem>
          <Select
            {...selectProps}
            value={filters.status}
            onChange={(event) => onChange({ status: event.target.value })}
            aria-label="Filtrar por estado"
            maxW={{ base: "100%", md: "170px" }}
          >
            <option value="all">Todos los estados</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </WrapItem>

        <WrapItem>
          <Select
            {...selectProps}
            value={filters.posterType}
            onChange={(event) => onChange({ posterType: event.target.value })}
            aria-label="Filtrar por tipo de publicador"
            maxW={{ base: "100%", md: "190px" }}
          >
            {POSTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </WrapItem>

        <WrapItem>
          <Select
            {...selectProps}
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value })}
            aria-label="Ordenar prospectos"
            maxW={{ base: "100%", md: "170px" }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </WrapItem>

        <WrapItem>
          <Flex align="center" gap="8px" px="10px" h="34px" borderRadius="10px" bg={inputBg}>
            <Switch
              size="sm"
              colorScheme="brand"
              isChecked={filters.phoneOnly}
              onChange={(event) => onChange({ phoneOnly: event.target.checked })}
            />
            <Text fontSize="xs" fontWeight="700" color={selectColor}>
              Con WhatsApp
            </Text>
          </Flex>
        </WrapItem>

        <WrapItem>
          <Flex align="center" gap="8px" px="10px" h="34px" borderRadius="10px" bg={inputBg}>
            <Switch
              size="sm"
              colorScheme="brand"
              isChecked={filters.hotOnly}
              onChange={(event) => onChange({ hotOnly: event.target.checked })}
            />
            <Text fontSize="xs" fontWeight="700" color={selectColor}>
              Solo calientes
            </Text>
          </Flex>
        </WrapItem>

        <WrapItem>
          <Flex align="center" gap="8px" px="10px" h="34px" borderRadius="10px" bg={inputBg}>
            <Switch
              size="sm"
              colorScheme="brand"
              isChecked={filters.mine}
              onChange={(event) => onChange({ mine: event.target.checked })}
            />
            <Text fontSize="xs" fontWeight="700" color={selectColor}>
              Mis prospectos
            </Text>
          </Flex>
        </WrapItem>

        <WrapItem>
          <Button size="sm" h="34px" variant="ghost" color={muted} onClick={onReset} fontWeight="600">
            Limpiar filtros
          </Button>
        </WrapItem>
      </Wrap>

      <Text mt="12px" fontSize="xs" color={muted} fontWeight="600">
        {loading ? "Buscando prospectos…" : `${total} prospecto${total === 1 ? "" : "s"} encontrados`}
      </Text>
    </Card>
  );
}
