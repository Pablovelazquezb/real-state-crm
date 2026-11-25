// Chakra imports
import { Flex, Image, Text, useColorModeValue } from "@chakra-ui/react";

// Custom components
export function SidebarBrand(props) {
  const { setOpenSidebar, openSidebar, from, largeLogo } = props;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.500", "secondaryGray.400");
  const logo = largeLogo && (largeLogo[0]?.logoSmImg || largeLogo[0]?.logoLgImg);

  return (
    <Flex
      align="center"
      justify={openSidebar ? "flex-start" : "center"}
      gap="11px"
      px={openSidebar ? "18px" : "0"}
      py="18px"
      cursor="pointer"
      onClick={() => !from && setOpenSidebar(!openSidebar)}
      userSelect="none"
      borderBottom="1px solid"
      borderColor={useColorModeValue("secondaryGray.400", "whiteAlpha.100")}
      mb="10px"
    >
      {logo ? (
        <Image
          src={openSidebar ? largeLogo[0]?.logoLgImg || logo : largeLogo[0]?.logoSmImg || logo}
          alt="Nova CRM"
          h="32px"
          style={{ objectFit: "contain" }}
        />
      ) : (
        <>
          <Flex
            align="center"
            justify="center"
            w="34px"
            h="34px"
            borderRadius="10px"
            bg="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
            color="white"
            fontWeight="800"
            fontSize="sm"
            flexShrink={0}
            boxShadow="0 6px 14px -8px rgba(79, 70, 229, 0.9)"
          >
            N
          </Flex>
          {openSidebar ? (
            <Flex direction="column" lineHeight="1.1">
              <Text fontWeight="800" fontSize="15px" color={textColor} letterSpacing="-0.02em">
                Nova CRM
              </Text>
              <Text fontSize="9px" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color={muted}>
                Real Estate
              </Text>
            </Flex>
          ) : null}
        </>
      )}
    </Flex>
  );
}

export default SidebarBrand;
