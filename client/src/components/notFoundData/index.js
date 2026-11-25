import { Box, Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { FiInbox } from "react-icons/fi";

/**
 * Estado vacío de las tablas. Mantiene la API del componente anterior
 * (mensaje opcional) para no romper las páginas que ya lo usan.
 */
const DataNotFound = ({ message }) => {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const bg = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  return (
    <Flex direction="column" align="center" justify="center" gap="8px" py="34px" w="100%">
      <Flex align="center" justify="center" w="46px" h="46px" borderRadius="14px" bg={bg}>
        <Icon as={FiInbox} boxSize="20px" color={muted} />
      </Flex>
      <Text fontSize="sm" fontWeight="700" color={textColor}>
        {message || "Todavía no hay registros"}
      </Text>
      <Text fontSize="xs" color={muted} textAlign="center" maxW="320px">
        Cuando agregues el primero aparecerá aquí con su información principal.
      </Text>
    </Flex>
  );
};

export default DataNotFound;
