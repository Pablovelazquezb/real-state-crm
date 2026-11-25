import {
  Badge,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useState } from "react";
import { FaFacebookF, FaPlay, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { groupUrlSlug } from "../constants";

const AddSectorModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="18px">
        <ModalHeader fontSize="lg">Nuevo sector de prospección</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb="14px">
            <FormLabel fontSize="sm" fontWeight="700">
              Nombre del sector
            </FormLabel>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Zona Cumbres"
              size="sm"
              borderRadius="10px"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="700">
              Descripción (opcional)
            </FormLabel>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Zona objetivo y tipo de prospectos que quieres captar"
              size="sm"
              borderRadius="10px"
              rows={3}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter gap="8px">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" variant="brand" onClick={handleSubmit} isLoading={loading} isDisabled={!name.trim()}>
            Crear sector
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SectorCard = ({ sector, onAddUrl, onRemoveUrl, onDelete, onScrape, busy }) => {
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const inputBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  const handleAdd = async () => {
    if (!url.trim()) return;
    setAdding(true);
    const ok = await onAddUrl(sector, url.trim());
    setAdding(false);
    if (ok) setUrl("");
  };

  return (
    <Card p="20px" border="1px solid" borderColor={borderColor}>
      <Flex justify="space-between" align="start" gap="10px">
        <div>
          <HStack spacing="8px">
            <Text fontWeight="800" fontSize="md" color={textColor}>
              {sector.name}
            </Text>
            <Badge colorScheme="brand" variant="subtle" borderRadius="full" px="8px">
              {sector.urls?.length || 0} grupo{(sector.urls?.length || 0) === 1 ? "" : "s"}
            </Badge>
          </HStack>
          {sector.description ? (
            <Text fontSize="xs" color={muted} mt="2px" noOfLines={2}>
              {sector.description}
            </Text>
          ) : null}
        </div>
        <Tooltip label="Eliminar sector" hasArrow>
          <IconButton
            aria-label="Eliminar sector"
            icon={<Icon as={FaTrash} />}
            size="xs"
            variant="ghost"
            color="red.400"
            onClick={() => onDelete(sector)}
          />
        </Tooltip>
      </Flex>

      <Flex direction="column" gap="6px" mt="14px" maxH="168px" minH="54px" flex="1" overflowY="auto" pr="2px">
        {(sector.urls || []).length === 0 ? (
          <Text fontSize="xs" color={muted} fontStyle="italic">
            Aún no hay grupos en este sector.
          </Text>
        ) : (
          sector.urls.map((groupUrl) => (
            <Flex
              key={groupUrl}
              align="center"
              justify="space-between"
              gap="8px"
              px="10px"
              py="6px"
              borderRadius="10px"
              bg={inputBg}
            >
              <HStack spacing="8px" minW="0">
                <Icon as={FaFacebookF} color="#1877F2" boxSize="11px" flexShrink={0} />
                <Tooltip label={groupUrl} hasArrow>
                  <Text fontSize="xs" fontWeight="600" color={muted} isTruncated maxW={{ base: "160px", md: "220px" }}>
                    {groupUrlSlug(groupUrl)}
                  </Text>
                </Tooltip>
              </HStack>
              <IconButton
                aria-label="Quitar grupo"
                icon={<Icon as={FaTimes} boxSize="9px" />}
                size="xs"
                variant="ghost"
                color={muted}
                onClick={() => onRemoveUrl(sector, groupUrl)}
              />
            </Flex>
          ))
        )}
      </Flex>

      <InputGroup size="sm" mt="12px" flexShrink={0}>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
          placeholder="https://facebook.com/groups/… o ID"
          borderRadius="10px"
          bg={inputBg}
          border="1px solid"
          borderColor={borderColor}
          fontSize="xs"
          _focus={{ borderColor: "brand.500", boxShadow: "none" }}
        />
        <InputRightElement h="full">
          <IconButton
            aria-label="Agregar grupo"
            icon={<Icon as={FaPlus} boxSize="10px" />}
            size="xs"
            variant="ghost"
            color="brand.500"
            isLoading={adding}
            onClick={handleAdd}
          />
        </InputRightElement>
      </InputGroup>

      <Button
        mt="12px"
        size="sm"
        variant="lightBrand"
        leftIcon={<Icon as={FaPlay} boxSize="10px" />}
        onClick={() => onScrape(sector)}
        isLoading={busy}
        fontWeight="700"
      >
        Extraer prospectos de este sector
      </Button>
    </Card>
  );
};

export default function SectorsPanel({ sectors, loading, onAddSector, onDeleteSector, onAddUrl, onRemoveUrl, onScrapeSector, saving }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const [creating, setCreating] = useState(false);

  const totalGroups = (sectors || []).reduce((acc, sector) => acc + (sector.urls?.length || 0), 0);

  const handleCreate = async (payload) => {
    setCreating(true);
    const ok = await onAddSector(payload);
    setCreating(false);
    if (ok) onClose();
  };

  return (
    <>
      <Flex align="center" justify="space-between" gap="12px" mb="16px" wrap="wrap">
        <div>
          <Text fontSize="md" fontWeight="800">
            Sectores y grupos de Facebook
          </Text>
          <Text fontSize="xs" color={muted}>
            {sectors?.length || 0} sectores · {totalGroups} grupos configurados
          </Text>
        </div>
        <Button size="sm" variant="brand" leftIcon={<Icon as={FaPlus} boxSize="10px" />} onClick={onOpen}>
          Nuevo sector
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="16px">
        {loading
          ? [0, 1, 2].map((key) => (
              <Card key={key} p="20px">
                <Skeleton height="18px" width="50%" borderRadius="6px" />
                <Skeleton height="110px" mt="14px" borderRadius="10px" />
              </Card>
            ))
          : (sectors || []).map((sector) => (
              <SectorCard
                key={sector._id}
                sector={sector}
                onAddUrl={onAddUrl}
                onRemoveUrl={onRemoveUrl}
                onDelete={onDeleteSector}
                onScrape={onScrapeSector}
                busy={saving}
              />
            ))}
      </SimpleGrid>

      <AddSectorModal isOpen={isOpen} onClose={onClose} onSubmit={handleCreate} loading={creating} />
    </>
  );
}
