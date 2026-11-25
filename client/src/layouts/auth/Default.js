// Chakra imports
import { Box, Flex, HStack, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import Footer from "components/footer/FooterAuth";
import React from "react";
import { FaCheckCircle, FaFacebookF, FaHandshake, FaWhatsapp } from "react-icons/fa";

const highlights = [
  { icon: FaFacebookF, text: "Prospectos de grupos de Facebook clasificados por intención" },
  { icon: FaHandshake, text: "Cruces automáticos entre demanda y propiedades disponibles" },
  { icon: FaWhatsapp, text: "Mensajes de WhatsApp listos y envío de leads al CRM" },
];

function AuthIllustration(props) {
  const { children } = props;

  const pageBg = useColorModeValue("secondaryGray.300", "navy.900");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");

  return (
    <Flex minH="100vh" bg={pageBg}>
      {/* Formulario */}
      <Flex
        direction="column"
        justify="center"
        align="center"
        w={{ base: "100%", lg: "50%" }}
        px={{ base: "22px", md: "48px" }}
        py={{ base: "32px", md: "48px" }}
      >
        <Box w="100%" maxW="420px">
          <HStack spacing="10px" mb="26px">
            <Flex
              align="center"
              justify="center"
              w="36px"
              h="36px"
              borderRadius="10px"
              bg="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
              color="white"
              fontWeight="800"
              fontSize="sm"
              boxShadow="0 8px 16px -10px rgba(79, 70, 229, 0.9)"
            >
              N
            </Flex>
            <Box lineHeight="1.1">
              <Text fontWeight="800" fontSize="15px" color={textColor} letterSpacing="-0.02em">
                Nova CRM
              </Text>
              <Text fontSize="9px" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color={muted}>
                Real Estate
              </Text>
            </Box>
          </HStack>

          {children}
        </Box>
        <Box w="100%" maxW="420px" mt="24px">
          <Footer />
        </Box>
      </Flex>

      {/* Panel de marca */}
      <Box
        display={{ base: "none", lg: "flex" }}
        w="50%"
        m="14px"
        ml="0"
        borderRadius="24px"
        bg="linear-gradient(150deg, #312E81 0%, #4F46E5 45%, #7C3AED 100%)"
        position="relative"
        overflow="hidden"
        direction="column"
        justify="center"
        px={{ lg: "54px", xl: "72px" }}
        py="64px"
      >
        {/* halos decorativos */}
        <Box position="absolute" top="-120px" right="-80px" w="320px" h="320px" borderRadius="full" bg="whiteAlpha.200" filter="blur(10px)" />
        <Box position="absolute" bottom="-140px" left="-100px" w="360px" h="360px" borderRadius="full" bg="blackAlpha.300" filter="blur(20px)" />

        <Box position="relative" zIndex="1">
          <Text fontSize="11px" fontWeight="800" letterSpacing="0.16em" textTransform="uppercase" color="whiteAlpha.700" mb="14px">
            Plataforma de prospección
          </Text>
          <Text fontSize={{ lg: "32px", xl: "38px" }} fontWeight="800" color="white" lineHeight="1.15" letterSpacing="-0.03em" maxW="440px">
            Tu cartera, tus prospectos y tus cierres en un solo lugar.
          </Text>
          <Text fontSize="sm" color="whiteAlpha.800" mt="14px" maxW="420px">
            Detecta oportunidades en grupos de Facebook, cruza demanda con oferta y contacta por WhatsApp en segundos.
          </Text>

          <Flex direction="column" gap="14px" mt="34px">
            {highlights.map((item) => (
              <HStack key={item.text} spacing="12px" align="start">
                <Flex
                  align="center"
                  justify="center"
                  w="30px"
                  h="30px"
                  borderRadius="9px"
                  bg="whiteAlpha.200"
                  flexShrink={0}
                >
                  <Icon as={item.icon} color="white" boxSize="13px" />
                </Flex>
                <Text fontSize="sm" color="whiteAlpha.900" fontWeight="500" pt="4px">
                  {item.text}
                </Text>
              </HStack>
            ))}
          </Flex>

          <HStack spacing="8px" mt="40px" color="whiteAlpha.700" fontSize="xs" fontWeight="600">
            <Icon as={FaCheckCircle} boxSize="11px" />
            <Text>Datos alojados en tu propio servidor</Text>
          </HStack>
        </Box>
      </Box>
    </Flex>
  );
}

export default AuthIllustration;
