/* eslint-disable */
import { NavLink, useLocation } from "react-router-dom";
import { Box, Flex, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";
import React from "react";

const KNOWN_ROLE_PATHS = [
  "user",
  "superAdmin",
  "admin",
  "manager",
  "teamleader",
  "executive",
  "telecaller",
];

const SECTION_ORDER = ["Operación", "Prospección", "Cartera", "Administración"];

const ITEM_ORDER = [
  "/default",
  "/prospector-fb",
  "/properties",
  "/lead",
  "/contacts",
  "/user",
  "/role",
];

const orderIndex = (list, value) => {
  const index = list.indexOf(value);
  return index === -1 ? list.length : index;
};

const resolveLayout = (role) => {
  if (KNOWN_ROLE_PATHS.includes(role)) return `/${role}`;
  return role === "superAdmin" ? "/superAdmin" : "/user";
};

export function SidebarLinks(props) {
  const location = useLocation();
  const { routes, openSidebar } = props;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const activeBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const activeColor = useColorModeValue("brand.700", "white");
  const textColor = useColorModeValue("secondaryGray.700", "secondaryGray.300");
  const hoverBg = useColorModeValue("secondaryGray.200", "whiteAlpha.100");
  const sectionColor = useColorModeValue("secondaryGray.500", "secondaryGray.500");

  const currentLayout = resolveLayout(user?.role);

  const visibleRoutes = (routes || []).filter(
    (route) =>
      route &&
      !route.under &&
      !route.hidden &&
      route.path &&
      route.layout?.includes(currentLayout) &&
      route.layout !== "/auth",
  );

  // Agrupa por sección conservando el orden de aparición.
  const groups = [];
  visibleRoutes.forEach((route) => {
    const name = route.section || "General";
    let group = groups.find((item) => item.name === name);
    if (!group) {
      group = { name, items: [] };
      groups.push(group);
    }
    group.items.push(route);
  });

  groups.sort((a, b) => orderIndex(SECTION_ORDER, a.name) - orderIndex(SECTION_ORDER, b.name));
  groups.forEach((group) => {
    group.items.sort(
      (a, b) => orderIndex(ITEM_ORDER, a.path) - orderIndex(ITEM_ORDER, b.path),
    );
  });

  const isActive = (path) => {
    if (!path) return false;
    if (location.pathname === path) return true;
    return path !== "/" && location.pathname.startsWith(`${path}/`);
  };

  return (
    <Flex direction="column" gap="2px">
      {groups.map((group) => (
        <Box key={group.name} mt="10px" _first={{ mt: 0 }}>
          {openSidebar ? (
            <Text
              px="12px"
              pt="10px"
              pb="6px"
              fontSize="10px"
              fontWeight="800"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color={sectionColor}
            >
              {group.name}
            </Text>
          ) : (
            <Box h="12px" />
          )}

          {group.items.map((route, index) => {
            const active = isActive(route.path);

            const content = (
              <Flex
                align="center"
                justify={openSidebar ? "flex-start" : "center"}
                gap={openSidebar ? "12px" : "0"}
                px={openSidebar ? "12px" : "0"}
                py="9px"
                borderRadius="10px"
                color={active ? activeColor : textColor}
                bg={active ? activeBg : "transparent"}
                fontWeight={active ? "700" : "500"}
                fontSize="sm"
                transition="background .15s ease, color .15s ease"
                _hover={{ bg: active ? activeBg : hoverBg }}
                minH="40px"
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="inherit"
                  flexShrink={0}
                  sx={{ "& svg": { width: "18px", height: "18px" } }}
                >
                  {route.icon}
                </Box>
                {openSidebar ? (
                  <Text noOfLines={1} flex="1" letterSpacing="-0.01em">
                    {route.label || route.name}
                  </Text>
                ) : null}
              </Flex>
            );

            return (
              <NavLink key={`${route.path}-${index}`} to={route.path}>
                {openSidebar ? (
                  content
                ) : (
                  <Tooltip label={route.label || route.name} placement="right" hasArrow openDelay={150}>
                    <Box>{content}</Box>
                  </Tooltip>
                )}
              </NavLink>
            );
          })}
        </Box>
      ))}
    </Flex>
  );
}

export default SidebarLinks;
