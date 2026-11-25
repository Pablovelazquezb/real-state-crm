import { Box, Flex, Icon, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import Card from "components/card/Card";
import CountUpComponent from "components/countUpComponent/countUpComponent";
import { FaCheckCircle, FaFire, FaHandshake, FaUsers, FaWhatsapp } from "react-icons/fa";
import React from "react";

const StatCard = ({ label, value, hint, icon, gradient, loading }) => {
  const valueColor = useColorModeValue("secondaryGray.900", "white");
  const hintColor = useColorModeValue("secondaryGray.600", "secondaryGray.400");

  return (
    <Card p={{ base: "12px", md: "18px" }}>
      <Flex align="center" gap={{ base: "10px", md: "14px" }}>
        <Flex
          align="center"
          justify="center"
          w={{ base: "36px", md: "48px" }}
          h={{ base: "36px", md: "48px" }}
          borderRadius="14px"
          bg={gradient}
          boxShadow="0 8px 18px -10px rgba(15, 23, 42, 0.45)"
          flexShrink={0}
        >
          <Icon as={icon} color="white" boxSize="20px" />
        </Flex>
        <Box minW="0" flex="1">
          <Text
            fontSize={{ base: "9px", md: "xs" }}
            fontWeight="700"
            letterSpacing="0.02em"
            textTransform="uppercase"
            color={hintColor}
            noOfLines={1}
          >
            {label}
          </Text>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" lineHeight="1.1" color={valueColor}>
            {loading ? "—" : <CountUpComponent targetNumber={Number(value) || 0} />}
          </Text>
          <Text fontSize={{ base: "10px", md: "xs" }} color={hintColor} noOfLines={1}>
            {hint}
          </Text>
        </Box>
      </Flex>
    </Card>
  );
};

export default function StatCards({ stats, loading }) {
  const cards = [
    {
      label: "Prospectos",
      value: stats?.total || 0,
      hint: `${stats?.nuevos || 0} sin contactar`,
      icon: FaUsers,
      gradient: "linear-gradient(135deg, #4338ca 0%, #6d5ce7 100%)",
    },
    {
      label: "Calientes",
      value: stats?.hot || 0,
      hint: "Score 75+",
      icon: FaFire,
      gradient: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
    },
    {
      label: "Con WhatsApp",
      value: stats?.withPhone || 0,
      hint: "Con teléfono",
      icon: FaWhatsapp,
      gradient: "linear-gradient(135deg, #128c7e 0%, #25d366 100%)",
    },
    {
      label: "Cruces",
      value: stats?.matches || 0,
      hint: "Coincidencias",
      icon: FaHandshake,
      gradient: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)",
    },
    {
      label: "En el CRM",
      value: stats?.converted || 0,
      hint: "En Leads",
      icon: FaCheckCircle,
      gradient: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
    },
  ];

  return (
    <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap={{ base: "10px", md: "16px" }}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </SimpleGrid>
  );
}
