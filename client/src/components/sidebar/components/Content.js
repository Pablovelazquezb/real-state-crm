import { Avatar, Box, Flex, HStack, Icon, IconButton, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";
import SidebarBrand from "./Brand";
import Links from "./Links";
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

const roleLabel = (role) => {
  if (!role) return "Empleado";
  if (role.toLowerCase() === "superadmin") return "Super admin";
  return role;
};

const initialsOf = (user) =>
  `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() ||
  user?.username?.[0]?.toUpperCase() ||
  "N";

function SidebarContent(props) {
  const { routes, setOpenSidebar, openSidebar, from, largeLogo } = props;
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const cardBg = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const borderColor = useColorModeValue("secondaryGray.400", "whiteAlpha.100");

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/auth");
  };

  return (
    <Flex direction="column" height="100%" minH="100vh">
      <SidebarBrand from={from} largeLogo={largeLogo} openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />

      <Box flex="1" px={openSidebar ? "12px" : "10px"} pb="16px" overflowY="auto">
        <Links routes={routes} openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      </Box>

      <Box px={openSidebar ? "12px" : "10px"} pb="16px" pt="10px" borderTop="1px solid" borderColor={borderColor}>
        <Flex
          align="center"
          justify={openSidebar ? "space-between" : "center"}
          gap="10px"
          p={openSidebar ? "10px" : "6px"}
          borderRadius="12px"
          bg={openSidebar ? cardBg : "transparent"}
        >
          <HStack spacing="10px" minW="0" flex="1">
            <Avatar
              name={initialsOf(user)}
              size="sm"
              bg="brand.100"
              color="brand.700"
              fontWeight="800"
              fontSize="12px"
            />
            {openSidebar ? (
              <Box minW="0">
                <Text fontSize="sm" fontWeight="700" color={textColor} noOfLines={1}>
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "Mi cuenta"}
                </Text>
                <Text fontSize="10px" fontWeight="600" color={muted} textTransform="capitalize" noOfLines={1}>
                  {roleLabel(user?.role)}
                </Text>
              </Box>
            ) : null}
          </HStack>

          {openSidebar ? (
            <Tooltip label="Cerrar sesión" hasArrow>
              <IconButton
                aria-label="Cerrar sesión"
                icon={<Icon as={FiLogOut} boxSize="15px" />}
                size="xs"
                variant="ghost"
                color={muted}
                onClick={handleLogout}
              />
            </Tooltip>
          ) : null}
        </Flex>
      </Box>
    </Flex>
  );
}

export default SidebarContent;
