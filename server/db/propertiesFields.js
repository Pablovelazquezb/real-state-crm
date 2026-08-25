const propertiesFields = [
    {
      name: "name",
      label: "Property Name",
      type: "text",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "String",
      isTableField: true,
      isView: true,
      options: [],
      validation: [
        {
          require: true,
          message: "Property Name is required"
        }
      ]
    },
    {
      name: "propertyType",
      label: "Property Type",
      type: "select",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Mixed",
      isTableField: true,
      isView: true,
      options: [
        { name: "Residential", value: "Residential" },
        { name: "Commercial", value: "Commercial" },
        { name: "Apartment", value: "Apartment" },
        { name: "House", value: "House" },
        { name: "Land", value: "Land" },
        { name: "Industrial", value: "Industrial" }
      ],
      validation: [
        {
          require: true,
          message: "Property Type is required"
        }
      ]
    },
    {
      name: "price",
      label: "Price ($)",
      type: "number",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Number",
      isTableField: true,
      isView: true,
      options: [],
      validation: [
        {
          require: true,
          message: "Price is required"
        }
      ]
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Mixed",
      isTableField: true,
      isView: true,
      options: [
        { name: "Available", value: "Available" },
        { name: "Booked", value: "Booked" },
        { name: "Sold", value: "Sold" },
        { name: "Blocked", value: "Blocked" },
        { name: "Pending", value: "Pending" }
      ],
      validation: [
        {
          require: true,
          message: "Status is required"
        }
      ]
    },
    {
      name: "location",
      label: "Location / Address",
      type: "text",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "String",
      isTableField: true,
      isView: true,
      options: [],
      validation: []
    },
    {
      name: "bedrooms",
      label: "Bedrooms",
      type: "number",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Number",
      isTableField: true,
      isView: true,
      options: [],
      validation: []
    },
    {
      name: "bathrooms",
      label: "Bathrooms",
      type: "number",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Number",
      isTableField: true,
      isView: true,
      options: [],
      validation: []
    },
    {
      name: "squareFeet",
      label: "Superficie / Área (m²)",
      type: "number",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Number",
      isTableField: true,
      isView: true,
      options: [],
      validation: []
    },
    {
      name: "yearBuilt",
      label: "Year Built",
      type: "number",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Number",
      isTableField: false,
      isView: true,
      options: [],
      validation: []
    },
    {
      name: "parking",
      label: "Parking Available",
      type: "radio",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "Mixed",
      isTableField: false,
      isView: true,
      options: [
        { name: "Yes", value: "Yes" },
        { name: "No", value: "No" }
      ],
      validation: []
    },
    {
      name: "propertyDescription",
      label: "Property Description",
      type: "text",
      fixed: true,
      isDefault: false,
      editable: true,
      delete: false,
      belongsTo: null,
      backendType: "String",
      isTableField: false,
      isView: true,
      options: [],
      validation: []
    }
  ];

exports.propertiesFields = propertiesFields;