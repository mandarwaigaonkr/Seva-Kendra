// Excel import template — Health › Leprosy
// Source of truth: sevaKendra-backend/src/modules/health/models/leprosy.model.js
// Verify with: node scripts/verify-import-templates.mjs leprosy

const GENDER = ["Male", "Female", "Other"];
const TYPE_OF_LEPROSY = ["Paucibacillary (PB)", "Multibacillary (MB)", "Unknown"];
const NUTRITION_STATUS = ["Normal", "Underweight", "Overweight", "Malnourished", "Severely Malnourished"];
const TREATMENT_STATUS = ["Not Started", "On MDT", "Treatment Completed", "Treatment Interrupted", "Defaulter"];
const OVERALL_STATUS = ["Active", "On Treatment", "Treatment Completed", "Lost to Follow-up", "Died", "Unknown"];

export default {
  title: "Leprosy Records",
  model: "health/models/leprosy.model.js",
  uniqueKeys: ["householdCode"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    { key: "name", label: "Name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "occupation", label: "Occupation", type: "text" },

    // Household details
    {
      key: "householdCode",
      label: "Household Code",
      type: "text",
      required: true,
      unique: true,
      hint: "Must be unique across leprosy records (one record per household code)",
    },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "nameOfRespondant", label: "Name of Respondent", type: "text", headerAliases: ["Name of Respondant"] },
    {
      key: "contactNoOfRespondant",
      label: "Respondent Contact Number",
      type: "phone",
      headerAliases: ["Contact of Respondant", "Contact No of Respondant"],
    },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Leprosy details
    {
      key: "typeOfLeprosy",
      label: "Type of Leprosy",
      type: "enum",
      options: TYPE_OF_LEPROSY,
      aliases: {
        "Paucibacillary (PB)": ["Pauci-Bacillary (PB)", "Paucibacillary", "PB"],
        "Multibacillary (MB)": ["Multi-Bacillary (MB)", "Multibacillary", "MB"],
      },
    },
    {
      key: "durationOfIllness",
      label: "Duration of Illness (months)",
      type: "number",
      min: 0,
      headerAliases: ["Duration of Illness"],
    },
    { key: "diagnosticDetails", label: "Diagnostic Details", type: "text" },
    { key: "comorbidities", label: "Comorbidities", type: "text" },
    { key: "nutritionStatus", label: "Nutrition Status", type: "enum", options: NUTRITION_STATUS },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },

    // Treatment status
    {
      key: "statusOfTreatment",
      label: "Status of Treatment",
      type: "enum",
      options: TREATMENT_STATUS,
      aliases: {
        "Treatment Completed": ["Completed"],
        Defaulter: ["Defaulted"],
        "Treatment Interrupted": ["Interrupted"],
      },
    },
    {
      key: "overallStatus",
      label: "Overall Status",
      type: "enum",
      options: OVERALL_STATUS,
      aliases: {
        "Treatment Completed": ["Cured", "Completed"],
        "Lost to Follow-up": ["Lost to Follow Up", "LTFU", "Defaulted"],
        Died: ["Deceased"],
      },
    },
  ],
  sampleRow: {
    name: "Karim Sheikh",
    gender: "Male",
    age: 50,
    contactNo: "9876543210",
    occupation: "Vegetable vendor",
    householdCode: "HH-1107",
    headOfHousehold: "Karim Sheikh",
    nameOfRespondant: "Rehana Sheikh",
    contactNoOfRespondant: "9876543213",
    wardNo: "Ward 11",
    habitation: "Ultadanga",
    projectResponsible: "Dr. S. Biswas",
    dateOfReporting: "2024-02-20",
    reportedBy: "Health Worker D",
    typeOfLeprosy: "Multibacillary (MB)",
    durationOfIllness: 6,
    diagnosticDetails: "Skin patches with sensory loss, slit-skin smear positive",
    comorbidities: "None",
    nutritionStatus: "Normal",
    individualCarePlan: "12-month MDT, self-care training for hands and feet",
    statusOfTreatment: "On MDT",
    overallStatus: "On Treatment",
  },
};
