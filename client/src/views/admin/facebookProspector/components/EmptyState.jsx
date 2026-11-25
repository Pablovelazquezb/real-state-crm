import { Box, Button, Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import React from "react";

/**
 * Estado vacío reutilizable con llamada a la acción opcional.
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  children,
}) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const iconBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  return (
    <Flex direction="column" align="center" justify="center" textAlign="center" py="56px" px="20px">
      <Flex align="center" justify="center" w="64px" h="64px" borderRadius="20px" bg={iconBg} mb="16px">
        <Icon as={icon} boxSize="26px" color="brand.500" />
      </Flex>
      <Text fontSize="lg" fontWeight="700" color={textColor}>
        {title}
      </Text>
      {description ? (
        <Text fontSize="sm" color={muted} maxW="440px" mt="6px">
          {description}
        </Text>
      ) : null}
      <Box mt={children ? "18px" : "18px"}>
        <Flex gap="10px" wrap="wrap" justify="center">
          {actionLabel ? (
            <Button size="sm" variant="brand" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          {secondaryLabel ? (
            <Button size="sm" variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </Flex>
      </Box>
      {children}
    </Flex>
  );
}
