// Chakra Imports
import { Box, Flex, Heading, Icon, IconButton, Spacer, Text, useColorModeValue } from "@chakra-ui/react";
import UserMenu from "components/navbar/UserMenu";
import { SidebarResponsive } from "components/sidebar/Sidebar";
import PropTypes from "prop-types";
import React from "react";
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from "react-icons/ai";

export default function AdminNavbar(props) {
  const { brandText, setOpenSidebar, openSidebar, routes } = props;

  const mainText = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const navbarBg = useColorModeValue("rgba(255, 255, 255, 0.86)", "rgba(11, 18, 32, 0.86)");
  const borderColor = useColorModeValue("secondaryGray.400", "whiteAlpha.100");

  return (
    <Flex
      position="fixed"
      top="0"
      right="0"
      left={{ base: "0", xl: openSidebar ? "280px" : "80px" }}
      h={{ base: "66px", md: "72px" }}
      px={{ base: "16px", md: "28px" }}
      align="center"
      gap={{ base: "8px", md: "14px" }}
      bg={navbarBg}
      backdropFilter="blur(14px)"
      borderBottom="1px solid"
      borderColor={borderColor}
      zIndex="30"
      transition="left .2s ease"
    >
      <SidebarResponsive
        routes={routes}
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />

      <IconButton
        display={{ base: "none", xl: "flex" }}
        aria-label="Mostrar u ocultar menú"
        icon={
          <Icon
            as={openSidebar ? AiOutlineMenuFold : AiOutlineMenuUnfold}
            boxSize="18px"
          />
        }
        size="sm"
        variant="ghost"
        color={muted}
        onClick={() => setOpenSidebar(!openSidebar)}
      />

      <Box minW="0">
        <Text
          fontSize="10px"
          fontWeight="800"
          letterSpacing="0.1em"
          textTransform="uppercase"
          color={muted}
          lineHeight="1.4"
        >
          Nova CRM
        </Text>
        <Heading
          fontSize={{ base: "lg", md: "xl" }}
          fontWeight="800"
          color={mainText}
          lineHeight="1.2"
          noOfLines={1}
        >
          {brandText || "Panel"}
        </Heading>
      </Box>

      <Spacer />

      <UserMenu />
    </Flex>
  );
}

AdminNavbar.propTypes = {
  brandText: PropTypes.string,
  secondary: PropTypes.bool,
  message: PropTypes.string,
  fixed: PropTypes.bool,
  onOpen: PropTypes.func,
};
