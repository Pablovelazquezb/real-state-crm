import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  Badge,
  HStack,
  Stack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  useColorModeValue,
  SimpleGrid,
} from "@chakra-ui/react";
import { SearchIcon, EmailIcon, PhoneIcon } from "@chakra-ui/icons";
import { LuBuilding2, LuBed, LuBath, LuMaximize, LuMapPin, LuCheckCircle2, LuPhoneCall, LuShieldCheck, LuSparkles } from "react-icons/lu";
import { FaBuilding, FaHome, FaStore, FaLandmark, FaKey } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getApi, postApi } from "services/api";
import { toast } from "react-toastify";
import Spinner from "components/spinner/Spinner";

export default function ClientPortal() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedPrice, setSelectedPrice] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modal States
  const [selectedProp, setSelectedProp] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Contact Form State
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await getApi("api/property/");
      if (res && res.data) {
        setProperties(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch client properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleOpenDetail = (prop) => {
    setSelectedProp(prop);
    setActivePhotoIdx(0);
    setIsDetailOpen(true);
  };

  const handleOpenContact = (prop = null) => {
    setSelectedProp(prop);
    setContactForm({
      name: "",
      email: "",
      phone: "",
      message: prop ? `Hola, me interesa la propiedad: ${prop.name || prop.propertyName}` : "Hola, me gustaría recibir asesoría sobre las propiedades disponibles.",
    });
    setIsContactOpen(true);
  };

  const handleSendContact = async (e) => {
    e.preventDefault();
    try {
      setContactLoading(true);
      const payload = {
        leadName: contactForm.name,
        leadEmail: contactForm.email,
        leadPhoneNumber: contactForm.phone,
        notes: contactForm.message + (selectedProp ? ` | Propiedad: ${selectedProp.name}` : ""),
        leadStatus: "New",
        leadSource: "Client Portal",
      };
      await postApi("api/lead/add", payload);
      toast.success("¡Gracias! Tu solicitud ha sido enviada. Un asesor te contactará pronto.");
      setIsContactOpen(false);
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Hubo un detalle al enviar el mensaje. Intenta nuevamente.");
    } finally {
      setContactLoading(false);
    }
  };

  // Filter Logic
  const filteredProperties = properties.filter((item) => {
    const pName = (item.name || item.propertyName || "").toLowerCase();
    const pLoc = (item.location || "").toLowerCase();
    const pType = (item.type || item.propertyType || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesQuery = !q || pName.includes(q) || pLoc.includes(q) || pType.includes(q);
    const matchesType = selectedType === "ALL" || pType === selectedType.toLowerCase();
    const matchesStatus = selectedStatus === "ALL" || (item.status || "Available").toLowerCase() === selectedStatus.toLowerCase();

    let matchesPrice = true;
    const price = Number(item.price || 0);
    if (selectedPrice === "UNDER_5M") matchesPrice = price <= 5000000;
    else if (selectedPrice === "5M_10M") matchesPrice = price > 5000000 && price <= 10000000;
    else if (selectedPrice === "ABOVE_10M") matchesPrice = price > 10000000;

    return matchesQuery && matchesType && matchesStatus && matchesPrice;
  });

  const getStatusBadge = (status) => {
    const st = (status || "Available").toLowerCase();
    if (st === "available" || st === "disponible") {
      return <Badge colorScheme="green" px={3} py={1} borderRadius="full">Disponible</Badge>;
    } else if (st === "pending" || st === "booked" || st === "en proceso") {
      return <Badge colorScheme="yellow" px={3} py={1} borderRadius="full">En Proceso</Badge>;
    } else {
      return <Badge colorScheme="red" px={3} py={1} borderRadius="full">Vendida / Rentada</Badge>;
    }
  };

  const getPhotos = (prop) => {
    if (prop?.propertyPhotos && prop.propertyPhotos.length > 0) {
      return prop.propertyPhotos.map((p) => typeof p === "string" ? p : p.img);
    }
    return [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    ];
  };

  return (
    <Box bg="gray.50" minH="100vh" color="gray.800">
      {/* Top Navbar */}
      <Box bg="white" boxShadow="sm" sticky="top" zIndex="100" borderBottom="1px solid" borderColor="gray.100">
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3} cursor="pointer" onClick={() => navigate("/portal")}>
              <Flex w={10} h={10} bg="brand.500" color="white" borderRadius="xl" align="center" justify="center">
                <Icon as={LuBuilding2} w={6} h={6} />
              </Flex>
              <Box>
                <Heading size="md" color="brand.600" letterSpacing="tight">
                  Nova Real Estate
                </Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="500">
                  Portal Exclusivo de Propiedades
                </Text>
              </Box>
            </HStack>

            <HStack spacing={4}>
              <Button
                variant="ghost"
                colorScheme="brand"
                size="sm"
                display={{ base: "none", md: "inline-flex" }}
                onClick={() => handleOpenContact(null)}
              >
                Solicitar Asesoría
              </Button>
              <Button
                colorScheme="brand"
                size="sm"
                px={5}
                borderRadius="lg"
                onClick={() => navigate("/auth/sign-in")}
              >
                Acceso Personal / Admin
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Banner Section */}
      <Box
        position="relative"
        bgGradient="linear(to-r, brand.600, brand.800)"
        color="white"
        py={{ base: 12, md: 20 }}
        px={4}
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-50px"
          right="-50px"
          w="400px"
          h="400px"
          bg="whiteAlpha.100"
          borderRadius="full"
          filter="blur(40px)"
        />
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={4} maxW="750px" mx="auto" textAlign="center" mb={8}>
            <Badge bg="whiteAlpha.200" color="white" px={4} py={1.5} borderRadius="full" textTransform="none" fontSize="sm">
              <Icon as={LuSparkles} mr={2} boxSize={4} boxSizeStyle={{ verticalAlign: "middle" }} /> Encuentra tu hogar ideal o inversión perfecta
            </Badge>
            <Heading size={{ base: "xl", md: "2xl" }} fontWeight="800" letterSpacing="tight">
              Catálogo de Propiedades Exclusivas
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.900" fontWeight="400">
              Explora las mejores casas, departamentos y espacios comerciales con disponibilidad inmediata y atención personalizada.
            </Text>
          </VStack>

          {/* Search & Filter Bar */}
          <Box
            bg="white"
            p={{ base: 4, md: 6 }}
            borderRadius="2xl"
            boxShadow="2xl"
            color="gray.800"
            maxW="1000px"
            mx="auto"
          >
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 1fr" }} gap={4} align="center">
              <GridItem>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar por nombre, zona o ciudad..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fontSize="sm"
                    borderRadius="xl"
                  />
                </InputGroup>
              </GridItem>
              <GridItem>
                <Select
                  size="lg"
                  fontSize="sm"
                  borderRadius="xl"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="ALL">Todos los Tipos</option>
                  <option value="Apartment">Departamentos</option>
                  <option value="House">Casas</option>
                  <option value="Residential">Residenciales</option>
                  <option value="Commercial">Comercial / Oficinas</option>
                  <option value="Land">Terrenos</option>
                </Select>
              </GridItem>
              <GridItem>
                <Select
                  size="lg"
                  fontSize="sm"
                  borderRadius="xl"
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                >
                  <option value="ALL">Precio (Todos)</option>
                  <option value="UNDER_5M">Hasta $5,000,000</option>
                  <option value="5M_10M">$5M - $10M</option>
                  <option value="ABOVE_10M">Más de $10M</option>
                </Select>
              </GridItem>
              <GridItem>
                <Select
                  size="lg"
                  fontSize="sm"
                  borderRadius="xl"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">Estatus (Todos)</option>
                  <option value="Available">Disponibles</option>
                  <option value="Pending">En Proceso</option>
                  <option value="Sold">Vendidas</option>
                </Select>
              </GridItem>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxW="container.xl" py={12}>
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="lg" fontWeight="700">
              Propiedades Disponibles ({filteredProperties.length})
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Fichas completas actualizadas en tiempo real.
            </Text>
          </Box>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" py={20}>
            <Spinner />
          </Flex>
        ) : filteredProperties.length === 0 ? (
          <Box textAlign="center" py={16} bg="white" borderRadius="2xl" boxShadow="sm">
            <Icon as={LuBuilding2} w={12} h={12} color="gray.300" mb={4} />
            <Heading size="md" color="gray.600" mb={2}>
              No encontramos propiedades con los filtros seleccionados
            </Heading>
            <Text color="gray.400" fontSize="sm" mb={4}>
              Intenta cambiar los parámetros de búsqueda o explora todo el catálogo.
            </Text>
            <Button
              size="sm"
              colorScheme="brand"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("ALL");
                setSelectedPrice("ALL");
                setSelectedStatus("ALL");
              }}
            >
              Restablecer Filtros
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {filteredProperties.map((prop) => {
              const photos = getPhotos(prop);
              const mainPhoto = photos[0];
              const priceFormatted = Number(prop.price || 0).toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN",
                maximumFractionDigits: 0,
              });

              return (
                <Box
                  key={prop._id || prop.id}
                  bg="white"
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="md"
                  transition="all 0.3s ease"
                  _hover={{ transform: "translateY(-6px)", boxShadow: "xl" }}
                  border="1px solid"
                  borderColor="gray.100"
                  display="flex"
                  flexDirection="column"
                >
                  {/* Property Image Container */}
                  <Box position="relative" h="240px" overflow="hidden" bg="gray.100">
                    <Image
                      src={mainPhoto}
                      alt={prop.name || prop.propertyName}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      transition="all 0.5s ease"
                      _hover={{ transform: "scale(1.05)" }}
                    />
                    <Box position="absolute" top={4} left={4}>
                      {getStatusBadge(prop.status)}
                    </Box>
                    <Box position="absolute" top={4} right={4}>
                      <Badge bg="blackAlpha.700" color="white" px={3} py={1} borderRadius="full" fontSize="xs">
                        {prop.type || prop.propertyType || "Propiedad"}
                      </Badge>
                    </Box>
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      p={4}
                      bgGradient="linear(to-t, blackAlpha.800, transparent)"
                      color="white"
                    >
                      <Text fontSize="2xl" fontWeight="800">
                        {priceFormatted}
                      </Text>
                    </Box>
                  </Box>

                  {/* Body Content */}
                  <Box p={6} flex="1" display="flex" flexDirection="column" justify="space-between">
                    <Box mb={4}>
                      <Heading size="md" mb={2} noOfLines={1} color="gray.800">
                        {prop.name || prop.propertyName}
                      </Heading>
                      <HStack color="gray.500" fontSize="sm">
                        <Icon as={LuMapPin} color="brand.500" boxSize={4} />
                        <Text noOfLines={1}>{prop.location || "Ubicación disponible en consulta"}</Text>
                      </HStack>
                    </Box>

                    {/* Amenities / Specs Pills */}
                    <HStack
                      spacing={4}
                      py={3}
                      px={4}
                      bg="gray.50"
                      borderRadius="xl"
                      mb={5}
                      justify="space-around"
                      fontSize="xs"
                      color="gray.700"
                      fontWeight="600"
                    >
                      <HStack title="Habitaciones">
                        <Icon as={LuBed} color="brand.500" boxSize={4} />
                        <Text>{prop.bedrooms || 0} Hab</Text>
                      </HStack>
                      <HStack title="Baños">
                        <Icon as={LuBath} color="brand.500" boxSize={4} />
                        <Text>{prop.bathrooms || 0} Baños</Text>
                      </HStack>
                      <HStack title="Superficie">
                        <Icon as={LuMaximize} color="brand.500" boxSize={4} />
                        <Text>{prop.squareFeet || 0} m²</Text>
                      </HStack>
                    </HStack>

                    {/* Action Buttons */}
                    <Grid templateColumns="1fr 1fr" gap={3}>
                      <Button
                        variant="outline"
                        colorScheme="brand"
                        size="sm"
                        borderRadius="xl"
                        onClick={() => handleOpenDetail(prop)}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        colorScheme="brand"
                        size="sm"
                        borderRadius="xl"
                        onClick={() => handleOpenContact(prop)}
                      >
                        Solicitar Info
                      </Button>
                    </Grid>
                  </Box>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Container>

      {/* PROPERTY DETAIL MODAL */}
      {selectedProp && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} size="xl" isCentered scrollBehavior="inside">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="2xl" overflow="hidden">
            <ModalHeader p={4} borderBottom="1px solid" borderColor="gray.100">
              <Flex justify="space-between" align="center" pr={6}>
                <Box>
                  <Heading size="md">{selectedProp.name || selectedProp.propertyName}</Heading>
                  <Text fontSize="xs" color="gray.500">{selectedProp.location}</Text>
                </Box>
                {getStatusBadge(selectedProp.status)}
              </Flex>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody p={6}>
              {/* Main Photo Gallery Carousel */}
              <Box mb={6}>
                {(() => {
                  const photos = getPhotos(selectedProp);
                  return (
                    <Box>
                      <Box h="300px" borderRadius="xl" overflow="hidden" mb={3} bg="gray.100">
                        <Image
                          src={photos[activePhotoIdx] || photos[0]}
                          alt="Main view"
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      </Box>
                      {photos.length > 1 && (
                        <HStack spacing={3} overflowX="auto" py={1}>
                          {photos.map((ph, idx) => (
                            <Box
                              key={idx}
                              w="70px"
                              h="50px"
                              borderRadius="lg"
                              overflow="hidden"
                              cursor="pointer"
                              border={activePhotoIdx === idx ? "2px solid" : "none"}
                              borderColor="brand.500"
                              opacity={activePhotoIdx === idx ? 1 : 0.6}
                              onClick={() => setActivePhotoIdx(idx)}
                            >
                              <Image src={ph} w="100%" h="100%" objectFit="cover" />
                            </Box>
                          ))}
                        </HStack>
                      )}
                    </Box>
                  );
                })()}
              </Box>

              {/* Specs & Info */}
              <VStack align="stretch" spacing={5}>
                <Flex justify="space-between" align="center" bg="brand.50" p={4} borderRadius="xl">
                  <Box>
                    <Text fontSize="xs" color="brand.700" fontWeight="600" textTransform="uppercase">
                      Precio de Lista
                    </Text>
                    <Text fontSize="2xl" fontWeight="800" color="brand.700">
                      {Number(selectedProp.price || 0).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </Text>
                  </Box>
                  <Badge colorScheme="brand" px={3} py={1} borderRadius="lg" fontSize="sm">
                    {selectedProp.type || selectedProp.propertyType}
                  </Badge>
                </Flex>

                <Box>
                  <Text fontWeight="700" mb={2} fontSize="sm">
                    Descripción de la Propiedad:
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                    {selectedProp.propertyDescription || selectedProp.description || "Propiedad exclusiva con acabados de primera calidad, excelente iluminación natural y ubicación estratégica."}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="700" mb={3} fontSize="sm">
                    Especificaciones Técnicas:
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} fontSize="xs" color="gray.700">
                    <HStack p={2.5} bg="gray.50" borderRadius="lg">
                      <Icon as={LuBed} color="brand.500" />
                      <Text>Habitaciones: <b>{selectedProp.bedrooms || "N/A"}</b></Text>
                    </HStack>
                    <HStack p={2.5} bg="gray.50" borderRadius="lg">
                      <Icon as={LuBath} color="brand.500" />
                      <Text>Baños: <b>{selectedProp.bathrooms || "N/A"}</b></Text>
                    </HStack>
                    <HStack p={2.5} bg="gray.50" borderRadius="lg">
                      <Icon as={LuMaximize} color="brand.500" />
                      <Text>Superficie: <b>{selectedProp.squareFeet || "N/A"} m²</b></Text>
                    </HStack>
                  </SimpleGrid>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.100">
              <Button variant="outline" mr={3} onClick={() => setIsDetailOpen(false)}>
                Cerrar
              </Button>
              <Button
                colorScheme="brand"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenContact(selectedProp);
                }}
              >
                Solicitar Informes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* CONTACT / INQUIRY MODAL */}
      <Modal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader borderBottom="1px solid" borderColor="gray.100">
            <Heading size="md">Solicitar Información</Heading>
            {selectedProp && (
              <Text fontSize="xs" color="brand.600" fontWeight="600" mt={1}>
                Propiedad: {selectedProp.name || selectedProp.propertyName}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />

          <form onSubmit={handleSendContact}>
            <ModalBody p={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="600">Nombre Completo</FormLabel>
                  <Input
                    placeholder="Ej. Juan Pérez"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    fontSize="sm"
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="600">Correo Electrónico</FormLabel>
                  <Input
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    fontSize="sm"
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="600">Teléfono / WhatsApp</FormLabel>
                  <Input
                    type="tel"
                    placeholder="55 1234 5678"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    fontSize="sm"
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="600">Mensaje / Dudas</FormLabel>
                  <Textarea
                    placeholder="Escribe aquí tus dudas o disponibilidad para agendar una cita..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    fontSize="sm"
                    borderRadius="lg"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter bg="gray.50" borderRadius="b-2xl">
              <Button variant="outline" mr={3} onClick={() => setIsContactOpen(false)}>
                Cancelar
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={contactLoading}>
                Enviar Mensaje
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Footer */}
      <Box bg="gray.900" color="gray.400" py={12} mt={16}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={8}>
            <Box>
              <HStack spacing={2} mb={3} color="white">
                <Icon as={LuBuilding2} w={6} h={6} color="brand.400" />
                <Text fontWeight="800" fontSize="lg">Nova Real Estate</Text>
              </HStack>
              <Text fontSize="sm" color="gray.400">
                Líderes en asesoría inmobiliaria, comercialización y gestión de propiedades residenciales y comerciales.
              </Text>
            </Box>
            <Box>
              <Text color="white" fontWeight="700" mb={3} fontSize="sm">Atención al Cliente</Text>
              <VStack align="start" spacing={2} fontSize="sm">
                <HStack><Icon as={PhoneIcon} color="brand.400" /><Text>+52 55 8432 1090</Text></HStack>
                <HStack><Icon as={EmailIcon} color="brand.400" /><Text>contacto@novarealestate.com</Text></HStack>
                <HStack><Icon as={LuMapPin} color="brand.400" /><Text>CDMX & Zonas Residenciales</Text></HStack>
              </VStack>
            </Box>
            <Box>
              <Text color="white" fontWeight="700" mb={3} fontSize="sm">Acceso Corporativo</Text>
              <Text fontSize="sm" mb={4}>¿Eres agente inmobiliario o administrador de Nova CRM?</Text>
              <Button
                colorScheme="brand"
                size="sm"
                onClick={() => navigate("/auth/sign-in")}
              >
                Acceso Empleados / Admin →
              </Button>
            </Box>
          </SimpleGrid>
          <Box borderTop="1px solid" borderColor="gray.800" pt={6} textAlign="center" fontSize="xs">
            © {new Date().getFullYear()} Nova Real Estate CRM. Todos los derechos reservados.
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
