import { CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormLabel,
  IconButton,
} from "@chakra-ui/react";
import Spinner from "components/spinner/Spinner";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getApi, postApi, putApi } from "services/api";
import { generateValidationSchema } from "utils";
import CustomForm from "utils/customForm";
import * as yup from "yup";
import Upload from "./components/Upload";

const defaultPropertyFields = [
  {
    name: "name",
    label: "Property Name",
    type: "text",
    validation: [{ require: true, message: "Property Name is required" }],
  },
  {
    name: "propertyType",
    label: "Property Type",
    type: "select",
    options: [
      { name: "Residential", value: "Residential" },
      { name: "Commercial", value: "Commercial" },
      { name: "Apartment", value: "Apartment" },
      { name: "House", value: "House" },
      { name: "Land", value: "Land" },
      { name: "Industrial", value: "Industrial" },
    ],
    validation: [{ require: true, message: "Property Type is required" }],
  },
  {
    name: "price",
    label: "Price ($)",
    type: "number",
    validation: [{ require: true, message: "Price is required" }],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { name: "Available", value: "Available" },
      { name: "Booked", value: "Booked" },
      { name: "Sold", value: "Sold" },
      { name: "Blocked", value: "Blocked" },
      { name: "Pending", value: "Pending" },
    ],
    validation: [{ require: true, message: "Status is required" }],
  },
  {
    name: "location",
    label: "Location / Address",
    type: "text",
  },
  {
    name: "bedrooms",
    label: "Bedrooms",
    type: "number",
  },
  {
    name: "bathrooms",
    label: "Bathrooms",
    type: "number",
  },
  {
    name: "squareFeet",
    label: "Superficie / Área (m²)",
    type: "number",
  },
  {
    name: "yearBuilt",
    label: "Year Built",
    type: "number",
  },
  {
    name: "parking",
    label: "Parking Available",
    type: "radio",
    options: [
      { name: "Yes", value: "Yes" },
      { name: "No", value: "No" },
    ],
  },
  {
    name: "propertyDescription",
    label: "Property Description",
    type: "text",
  },
];

const Edit = (props) => {
  const { data } = props;
  const [propertyPhotos, setPropertyPhotos] = useState([]);

  const activeFields =
    props?.propertyData?.fields && props.propertyData.fields.length > 0
      ? props.propertyData.fields
      : defaultPropertyFields;

  const activeModuleData = props?.propertyData?._id
    ? props.propertyData
    : { fields: activeFields };

  const initialFieldValues = Object?.fromEntries(
    activeFields?.map((field) => [field?.name, ""]),
  );
  const [initialValues, setInitialValues] = useState({
    ...initialFieldValues,
    createBy: JSON.parse(localStorage.getItem("user"))?._id || "admin",
  });

  const param = useParams();

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: yup
      .object()
      ?.shape(generateValidationSchema(activeFields)),
    enableReinitialize: true,
    onSubmit: (values) => {
      EditData();
    },
  });

  const {
    errors,
    touched,
    values,
    handleBlur,
    handleChange,
    handleSubmit,
    setFieldValue,
  } = formik;

  const [isLoding, setIsLoding] = useState(false);

  const EditData = async () => {
    try {
      setIsLoding(true);
      const propId = props?.selectedId || param?.id;
      let response = await putApi(
        `api/property/edit/${propId}`,
        values,
      );

      if (propertyPhotos && propertyPhotos.length > 0 && propId) {
        const formData = new FormData();
        propertyPhotos.forEach((file) => {
          formData.append("property", file);
        });
        await postApi(`api/property/add-property-photos/${propId}`, formData);
      }

      if (response?.status === 200) {
        props.onClose();
        setPropertyPhotos([]);
        props.setAction((pre) => !pre);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoding(false);
    }
  };

  const handleClose = () => {
    props.onClose(false);
    props.setSelectedId && props?.setSelectedId();
  };

  const fetchData = async () => {
    if (data) {
      setInitialValues((prev) => ({ ...prev, ...data }));
    } else if (props?.selectedId) {
      try {
        setIsLoding(true);
        let response = await getApi("api/property/view/", props?.selectedId);
        setInitialValues((prev) => ({ ...prev, ...(response?.data?.property || response?.data) }));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoding(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [props?.selectedId, data]);

  return (
    <div>
      <Drawer isOpen={props?.isOpen} size={props?.size}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader
            alignItems={"center"}
            justifyContent="space-between"
            display="flex"
          >
            Edit {values?.name || "Property"}
            <IconButton onClick={handleClose} icon={<CloseIcon />} />
          </DrawerHeader>
          <DrawerBody>
            {isLoding ? (
              <Flex
                justifyContent={"center"}
                alignItems={"center"}
                width="100%"
              >
                <Spinner />
              </Flex>
            ) : (
              <>
                <CustomForm
                  moduleData={activeModuleData}
                  values={values}
                  setFieldValue={setFieldValue}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  errors={errors}
                  touched={touched}
                />
                <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.100">
                  <FormLabel fontSize="sm" fontWeight="600" mb="8px">
                    Property Photos / Fotos de la Propiedad
                  </FormLabel>
                  <Upload
                    count={propertyPhotos?.length}
                    onFileSelect={(files) => setPropertyPhotos(files)}
                    text="Property Photos"
                  />
                </Box>
              </>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button
              size="sm"
              sx={{ textTransform: "capitalize" }}
              variant="brand"
              disabled={isLoding}
              type="submit"
              onClick={handleSubmit}
            >
              {isLoding ? <Spinner /> : "Update"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              sx={{
                marginLeft: 2,
                textTransform: "capitalize",
              }}
              onClick={() => {
                props?.onClose(false);
              }}
            >
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Edit;
