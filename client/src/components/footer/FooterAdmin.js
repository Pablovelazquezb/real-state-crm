/* eslint-disable */
import React from "react";
import { Flex, Text, useColorModeValue } from "@chakra-ui/react";

export default function Footer() {
  const textColor = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.400", "whiteAlpha.100");

  return (
    <Flex
      as="footer"
      px={{ base: "18px", md: "30px" }}
      py="18px"
      mt="10px"
      borderTop="1px solid"
      borderColor={borderColor}
      justify="space-between"
      align="center"
      gap="10px"
      wrap="wrap"
      fontSize="xs"
      color={textColor}
    >
      <Text fontWeight="600">
        © {new Date().getFullYear()} Nova CRM · Real Estate
      </Text>
      <Text>Prospección y cartera en un solo lugar</Text>
    </Flex>
  );
}
