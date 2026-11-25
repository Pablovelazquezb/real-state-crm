import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import React, { useState } from "react";
import { FaClock, FaPlay, FaRedo, FaRobot, FaStop, FaTerminal } from "react-icons/fa";
import EmptyState from "./EmptyState";
import { JOB_STATUS, formatDateTime } from "../constants";

const Metric = ({ label, value, color }) => (
  <Box>
    <Text fontSize="10px" fontWeight="800" textTransform="uppercase" letterSpacing="0.04em" color="secondaryGray.600">
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="800" color={color || "inherit"}>
      {value}
    </Text>
  </Box>
);

const JobRow = ({ job, onCancel, onRetry }) => {
  const [showLogs, setShowLogs] = useState(false);
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const muted = useColorModeValue("secondaryGray.600", "secondaryGray.400");
  const borderColor = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const logBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const status = JOB_STATUS[job.status] || JOB_STATUS.queued;
  const isActive = job.status === "running" || job.status === "queued";
  const isFailed = job.status === "failed";

  return (
    <Card p="18px" border="1px solid" borderColor={borderColor}>
      <Flex justify="space-between" align="start" gap="12px" wrap="wrap">
        <Box minW="0">
          <HStack spacing="8px" wrap="wrap">
            <Badge colorScheme={status.scheme} borderRadius="full" px="10px" py="3px" fontWeight="800">
              {status.label}
            </Badge>
            <Text fontSize="sm" fontWeight="800" color={textColor} noOfLines={1}>
              {job.sectorName || `${job.urls?.length || 0} grupos`}
            </Text>
            {job.aiEnrich ? (
              <Tooltip label="Enriquecimiento con IA" hasArrow>
                <Badge colorScheme="purple" variant="subtle" borderRadius="full">
                  <Icon as={FaRobot} boxSize="8px" mr="4px" />
                  IA
                </Badge>
              </Tooltip>
            ) : null}
          </HStack>
          <Text fontSize="xs" color={muted} mt="4px">
            {job.stage} · {formatDateTime(job.createdAt)}
          </Text>
        </Box>

        <HStack spacing="6px">
          {isActive ? (
            <Button size="xs" variant="ghost" color="red.400" leftIcon={<Icon as={FaStop} boxSize="9px" />} onClick={() => onCancel(job)}>
              Cancelar
            </Button>
          ) : (
            <Button size="xs" variant="ghost" color={muted} leftIcon={<Icon as={FaRedo} boxSize="9px" />} onClick={() => onRetry(job)}>
              Repetir
            </Button>
          )}
        </HStack>
      </Flex>

      {isActive ? (
        <Flex mt="10px" align="center" gap="6px" fontSize="xs" color="brand.500" fontWeight="700">
          <Icon as={FaClock} boxSize="10px" />
          Procesando en segundo plano…
        </Flex>
      ) : null}

      <SimpleGrid columns={{ base: 2, md: 5 }} gap="10px" mt="12px">
        <Metric label="Publicaciones" value={job.itemsFetched || 0} />
        <Metric label="Nuevos" value={job.leadsCreated || 0} color="green.500" />
        <Metric label="Repetidos" value={job.duplicates || 0} />
        <Metric label="Descartados" value={job.skipped || 0} />
        <Metric label="Límite" value={job.resultsLimit || 0} />
      </SimpleGrid>

      {isFailed && job.error ? (
        <Flex mt="12px" p="10px" borderRadius="10px" bg="red.50" color="red.600" fontSize="xs" fontWeight="600" gap="6px">
          <Icon as={FaTerminal} boxSize="10px" mt="2px" />
          <Text>{job.error}</Text>
        </Flex>
      ) : null}

      {job.logs?.length ? (
        <>
          <Button size="xs" variant="link" color={muted} mt="8px" onClick={() => setShowLogs((prev) => !prev)}>
            {showLogs ? "Ocultar bitácora" : `Ver bitácora (${job.logs.length})`}
          </Button>
          {showLogs ? (
            <Box mt="8px" p="10px" borderRadius="10px" bg={logBg} fontSize="10px" fontFamily="mono" maxH="140px" overflowY="auto">
              {job.logs.map((line, index) => (
                <Text key={`${line}-${index}`} color={muted} whiteSpace="pre-wrap">
                  {line}
                </Text>
              ))}
            </Box>
          ) : null}
        </>
      ) : null}
    </Card>
  );
};

export default function JobsPanel({ jobs, loading, onCancel, onRetry, onNewScrape }) {
  if (loading) {
    return (
      <SimpleGrid columns={1} gap="12px">
        {[0, 1, 2].map((key) => (
          <Card key={key} p="18px">
            <Skeleton height="18px" width="35%" borderRadius="6px" />
            <Skeleton height="46px" mt="12px" borderRadius="10px" />
          </Card>
        ))}
      </SimpleGrid>
    );
  }

  if (!jobs?.length) {
    return (
      <Card p="0">
        <EmptyState
          icon={FaPlay}
          title="Todavía no hay extracciones"
          description="Lanza tu primera extracción para traer publicaciones de tus grupos de Facebook y clasificarlas automáticamente."
          actionLabel="Nueva extracción"
          onAction={onNewScrape}
        />
      </Card>
    );
  }

  return (
    <SimpleGrid columns={1} gap="12px">
      {jobs.map((job) => (
        <JobRow key={job._id} job={job} onCancel={onCancel} onRetry={onRetry} />
      ))}
    </SimpleGrid>
  );
}
