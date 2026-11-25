import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import {
  Flex,
  IconButton,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import React from "react";
import { useEffect } from "react";

const Pagination = (props) => {
  const {
    gotoPage,
    gopageValue,
    setGopageValue,
    pageCount,
    canPreviousPage,
    previousPage,
    canNextPage,
    pageOptions,
    setPageSize,
    nextPage,
    pageSize,
    pageIndex,
  } = props;

  useEffect(() => {
    setGopageValue(1);
  }, []);

  return (
    <Flex
      justifyContent={pageOptions?.length !== 1 ? "space-between" : "end"}
      mt={2}
      alignItems="center"
    >
      {pageOptions?.length !== 1 && (
        <Flex gap="6px">
          <Tooltip label="Primera página" hasArrow>
            <IconButton
              onClick={() => {
                gotoPage(0);
                setGopageValue(1);
              }}
              isDisabled={!canPreviousPage}
              icon={<ArrowLeftIcon h={2.5} w={2.5} />}
              size="sm"
              variant="outline"
            />
          </Tooltip>
          <Tooltip label="Página anterior" hasArrow>
            <IconButton
              onClick={() => {
                previousPage();
                setGopageValue((pre) => pre - 1);
              }}
              isDisabled={!canPreviousPage}
              icon={<ChevronLeftIcon h={4} w={4} />}
              size="sm"
              variant="outline"
            />
          </Tooltip>
        </Flex>
      )}

      <Flex alignItems="center">
        {pageOptions?.length !== 1 && (
          <>
            <Text flexShrink="0" mr={6} fontSize="sm" color="secondaryGray.600" fontWeight="600">
              Página{" "}
              <Text fontWeight="800" as="span" color="secondaryGray.900">
                {pageIndex + 1}
              </Text>{" "}
              de{" "}
              <Text fontWeight="800" as="span" color="secondaryGray.900">
                {pageOptions?.length}
              </Text>
            </Text>
            <Text flexShrink="0" fontSize="sm" color="secondaryGray.600">
              Ir a:
            </Text>{" "}
            <NumberInput
              ml={2}
              mr={6}
              w={20}
              size="sm"
              min={1}
              max={pageOptions?.length}
              value={gopageValue}
              onChange={(value) => {
                const page = value ? value - 1 : 0;
                gotoPage(page);
                setGopageValue(value);
              }}
              defaultValue={pageIndex + 1}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </>
        )}
        <Select
          w={36}
          size="sm"
          borderRadius="10px"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e?.target?.value));
          }}
        >
          {[5, 10, 20, 30, 40, 50]?.map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize} por página
            </option>
          ))}
        </Select>
      </Flex>

      {pageOptions?.length !== 1 && (
        <Flex>
          <Tooltip label="Next Page">
            <IconButton
              onClick={() => {
                nextPage();
                setGopageValue((pre) => pre + 1);
              }}
              isDisabled={!canNextPage}
              icon={<ChevronRightIcon h={6} w={6} />}
            />
          </Tooltip>
          <Tooltip label="Last Page">
            <IconButton
              onClick={() => {
                gotoPage(pageCount - 1);
                setGopageValue(pageCount);
              }}
              isDisabled={!canNextPage}
              icon={<ArrowRightIcon h={3} w={3} />}
              ml={4}
            />
          </Tooltip>
        </Flex>
      )}
    </Flex>
  );
};

export default Pagination;
