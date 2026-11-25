import {
  Avatar,
  Box,
  Flex,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import { MdSpaceDashboard } from "react-icons/md";

const initialsOf = (user) =>
  `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() ||
  user?.username?.[0]?.toUpperCase() ||
  "N";

const roleLabel = (role) => {
  if (!role) return "Empleado";
  if (String(role).toLowerCase() === "superadmin") return "Super admin";
  return role;
};

export default function UserMenu() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.400", "whiteAlpha.100");
  const menuBg = useColorModeValue("white", "navy.800");
  const hoverBg = useColorModeValue("secondaryGray.200", "whiteAlpha.100");

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/auth");
  };

  return (
    <Menu placement="bottom-end">
      <MenuButton>
        <Flex
          align="center"
          gap="10px"
          px={{ base: 0, md: "10px" }}
          py="6px"
          borderRadius="10px"
          _hover={{ bg: hoverBg }}
          transition="background .15s ease"
        >
          <Avatar
            name={initialsOf(user)}
            size="sm"
            w="34px"
            h="34px"
            bg="brand.100"
            color="brand.700"
            fontWeight="800"
            fontSize="12px"
          />
          <Box display={{ base: "none", md: "block" }} textAlign="left">
            <Text fontSize="sm" fontWeight="700" color={textColor} lineHeight="1.2" noOfLines={1} maxW="150px">
              {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username}
            </Text>
            <Text fontSize="10px" fontWeight="600" color={muted} textTransform="capitalize">
              {roleLabel(user?.role)}
            </Text>
          </Box>
          <Icon as={FiChevronDown} color={muted} boxSize="14px" display={{ base: "none", md: "block" }} />
        </Flex>
      </MenuButton>

      <MenuList
        p="6px"
        mt="8px"
        borderRadius="14px"
        bg={menuBg}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="0 18px 40px -24px rgba(15, 23, 42, 0.45)"
        minW="220px"
        zIndex="popover"
      >
        <Box px="12px" py="10px" borderBottom="1px solid" borderColor={borderColor} mb="6px">
          <Text fontSize="sm" fontWeight="700" color={textColor} noOfLines={1}>
            {`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Mi cuenta"}
          </Text>
          <Text fontSize="xs" color={muted} noOfLines={1}>
            {user?.username}
          </Text>
        </Box>

        <MenuItem
          borderRadius="8px"
          fontSize="sm"
          icon={<Icon as={MdSpaceDashboard} boxSize="14px" />}
          onClick={() => navigate("/default")}
        >
          Ir al panel
        </MenuItem>
        <MenuItem
          borderRadius="8px"
          fontSize="sm"
          icon={<Icon as={FiUser} boxSize="14px" />}
          onClick={() => navigate(`/userView/${user?._id}`)}
        >
          Mi perfil
        </MenuItem>

        <MenuDivider borderColor={borderColor} />

        <MenuItem
          borderRadius="8px"
          fontSize="sm"
          color="red.500"
          icon={<Icon as={FiLogOut} boxSize="14px" />}
          onClick={handleLogout}
        >
          Cerrar sesión
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
