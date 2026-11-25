/*eslint-disable*/
import React from "react";
import { Flex, Text, useColorModeValue } from "@chakra-ui/react";

export default function FooterAuth() {
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");

  return (
    <Flex justify="space-between" align="center" gap="10px" wrap="wrap" fontSize="xs" color={muted}>
      <Text fontWeight="600">© {new Date().getFullYear()} Nova CRM</Text>
      <Text>Prospección · Cartera · Clientes</Text>
    </Flex>
  );
}
