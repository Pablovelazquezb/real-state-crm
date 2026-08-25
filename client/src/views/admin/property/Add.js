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
  FormLabel,
  IconButton,
} from "@chakra-ui/react";
import Spinner from "components/spinner/Spinner";
import { useFormik } from "formik";
import { useState } from "react";
import { postApi } from "services/api";
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

const Add = (props) => {
  const [isLoding, setIsLoding] = useState(false);
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

  const initialValues = {
    ...initialFieldValues,
    createBy: JSON.parse(localStorage.getItem("user"))?._id || "admin",
  };

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema: yup
      .object()
      ?.shape(generateValidationSchema(activeFields)),

    onSubmit: (values) => {
      AddData();
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

  const AddData = async () => {
    try {
      setIsLoding(true);

      // Save directly to property endpoint (Supabase + DB)
      let resProp = await postApi("api/property/add", values);
      let propId = resProp?.data?._id || resProp?.data?.id;

      // Also call form/add if custom field module ID exists
      if (props?.propertyData?._id) {
        let resForm = await postApi("api/form/add", {
          ...values,
          moduleId: props?.propertyData?._id,
        });
        if (!propId) propId = resForm?.data?._id;
      }

      // Upload selected property photos if any
      if (propertyPhotos && propertyPhotos.length > 0 && propId) {
        const formData = new FormData();
        propertyPhotos.forEach((file) => {
          formData.append("property", file);
        });
        await postApi(`api/property/add-property-photos/${propId}`, formData);
      }

      props.onClose();
      formik.resetForm();
      setPropertyPhotos([]);
      props.setAction((pre) => !pre);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoding(false);
    }
  };

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
            Add Property
            <IconButton onClick={props?.onClose} icon={<CloseIcon />} />
          </DrawerHeader>
          <DrawerBody>
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
          </DrawerBody>

          <DrawerFooter>
            <Button
              size="sm"
              sx={{ textTransform: "capitalize" }}
              disabled={isLoding}
              variant="brand"
              type="submit"
              onClick={handleSubmit}
            >
              {isLoding ? <Spinner /> : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              sx={{
                marginLeft: 2,
                textTransform: "capitalize",
              }}
              onClick={props?.onClose}
            >
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Add;
