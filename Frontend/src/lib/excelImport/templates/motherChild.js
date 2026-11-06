// Excel import template — Health › Mother & Child
// Source of truth: sevaKendra-backend/src/modules/health/models/motherChild.model.js
// Verify with: node scripts/verify-import-templates.mjs motherChild

const GENDER = ["Male", "Female", "Other"];
const PREGNANT_OR_LACTATING = ["Pregnant", "Lactating", "Both", "Neither"];
const DELIVERY_AREA = ["Home", "Hospital", "Primary Health Center", "Community Health Center", "Private Clinic", "Other"];
const BIRTH_CERTIFICATE = ["Available", "Not Available", "In Process"];
const IMMUNIZATION = ["Complete", "Incomplete", "Not Started", "In Progress", "Unknown"];
const NUTRITION = ["Normal", "Underweight", "Overweight", "Malnourished", "Severely Malnourished"];

const IMMUNIZATION_ALIASES = {
  Complete: ["Completed", "Fully Immunized", "Full"],
  Incomplete: ["Partial", "Partially Immunized"],
  "In Progress": ["Ongoing", "Age Appropriate"],
};
const NUTRITION_ALIASES = {
  Malnourished: ["MAM", "Moderately Malnourished"],
  "Severely Malnourished": ["SAM", "Severe Acute Malnutrition"],
};

export default {
  title: "Mother & Child Records",
  model: "health/models/motherChild.model.js",
  uniqueKeys: ["householdCode", "uniqueId"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    { key: "householdCode", label: "Household Code", type: "text", required: true, unique: true, hint: "Must be unique, e.g. HH-201" },
    { key: "uniqueId", label: "Unique ID", type: "text", required: true, unique: true, hint: "Must be unique, e.g. MC-001" },
    { key: "nameOfMother", label: "Name of Mother", type: "text", required: true, headerAliases: ["Mother Name"] },
    { key: "ageOfMother", label: "Age of Mother", type: "integer", required: true, min: 15, max: 50, headerAliases: ["Mother Age"], hint: "15 to 50" },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M", "Boy"], Female: ["F", "Girl"] } },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "district", label: "District", type: "text", required: true },
    { key: "state", label: "State", type: "text", required: true },

    // Child
    { key: "nameOfChild", label: "Name of Child", type: "text", required: true, headerAliases: ["Child Name"] },
    { key: "ageOfChild", label: "Age of Child (years)", type: "number", required: true, min: 0, max: 18, headerAliases: ["Age of Child", "Child Age"], hint: "In years, 0 to 18 (use 0.5 for six months)" },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Maternal health
    {
      key: "pregnantOrLactatingMother",
      label: "Pregnant or Lactating Mother",
      type: "enum",
      required: true,
      options: PREGNANT_OR_LACTATING,
      aliases: { Neither: ["None", "No"], Lactating: ["Breastfeeding", "Nursing"] },
      headerAliases: ["Pregnant / Lactating", "Mother Status"],
    },
    { key: "antenatalCareDetails", label: "Antenatal Care Details", type: "text", headerAliases: ["ANC Details"] },
    { key: "deliveryDetails", label: "Delivery Details", type: "text" },
    {
      key: "deliveryArea",
      label: "Delivery Area",
      type: "enum",
      options: DELIVERY_AREA,
      aliases: {
        "Primary Health Center": ["PHC", "Primary Health Centre"],
        "Community Health Center": ["CHC", "Community Health Centre"],
        Hospital: ["Institutional", "Government Hospital", "District Hospital"],
        "Private Clinic": ["Private Hospital", "Nursing Home"],
      },
      headerAliases: ["Place of Delivery"],
    },
    {
      key: "birthCertificate",
      label: "Birth Certificate",
      type: "enum",
      options: BIRTH_CERTIFICATE,
      aliases: { Available: ["Yes", "Y"], "Not Available": ["No", "N"], "In Process": ["Applied", "In Progress"] },
    },
    { key: "postnatalCareDetails", label: "Postnatal Care Details", type: "text", headerAliases: ["PNC Details"] },
    { key: "immunizationStatus", label: "Immunization Status (Mother)", type: "enum", options: IMMUNIZATION, aliases: IMMUNIZATION_ALIASES, headerAliases: ["Immunization Status", "Mother Immunization Status"] },
    { key: "nutritionalStatus", label: "Nutritional Status (Mother)", type: "enum", options: NUTRITION, aliases: NUTRITION_ALIASES, headerAliases: ["Nutritional Status", "Mother Nutritional Status"] },
    { key: "healthCheckups", label: "Health Checkups", type: "text" },

    // Child health
    { key: "childImmunizationStatus", label: "Child Immunization Status", type: "enum", options: IMMUNIZATION, aliases: IMMUNIZATION_ALIASES },
    { key: "childNutritionalStatus", label: "Child Nutritional Status", type: "enum", options: NUTRITION, aliases: NUTRITION_ALIASES },
    { key: "childDevelopmentMilestones", label: "Child Development Milestones", type: "text" },

    // Support services
    { key: "servicesProvided", label: "Services Provided", type: "text", headerAliases: ["Remarks"] },
    { key: "referralsGiven", label: "Referrals Given", type: "text" },
    { key: "governmentSchemes", label: "Government Schemes", type: "text", hint: "e.g. JSY, PMMVY, ICDS" },
  ],
  sampleRow: {
    householdCode: "HH-201",
    uniqueId: "MC-001",
    nameOfMother: "Rina Mondal",
    ageOfMother: 28,
    gender: "Female",
    contactNo: "9876543210",
    headOfHousehold: "Ratan Mondal",
    wardNo: "Ward 5",
    habitation: "Rajabagan",
    projectResponsible: "Dr. Priya Sen",
    district: "Kolkata",
    state: "West Bengal",
    nameOfChild: "Puja Mondal",
    ageOfChild: 1,
    dateOfReporting: "2024-01-15",
    reportedBy: "ASHA Worker Mita",
    pregnantOrLactatingMother: "Lactating",
    antenatalCareDetails: "4 ANC visits completed, IFA tablets given",
    deliveryDetails: "Normal delivery, birth weight 2.8 kg",
    deliveryArea: "Primary Health Center",
    birthCertificate: "Available",
    postnatalCareDetails: "3 PNC home visits by ASHA",
    immunizationStatus: "Complete",
    nutritionalStatus: "Normal",
    healthCheckups: "Monthly check-up at Anganwadi",
    childImmunizationStatus: "In Progress",
    childNutritionalStatus: "Normal",
    childDevelopmentMilestones: "Walking with support, says first words",
    servicesProvided: "Take-home ration, growth monitoring",
    referralsGiven: "Referred to PHC for measles vaccine",
    governmentSchemes: "PMMVY, JSY",
  },
};
