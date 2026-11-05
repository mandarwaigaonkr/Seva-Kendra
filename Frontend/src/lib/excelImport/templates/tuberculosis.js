// Excel import template — Health › Tuberculosis
// Source of truth: sevaKendra-backend/src/modules/health/models/tuberculosis.model.js
// Verify with: node scripts/verify-import-templates.mjs tuberculosis

const GENDER = ["Male", "Female", "Other"];
const TYPE_OF_TB = ["Pulmonary TB", "Extra-pulmonary TB", "MDR TB", "XDR TB", "Other"];
const NUTRITION_STATUS = ["Normal", "Underweight", "Overweight", "Malnourished", "Severely Malnourished"];
const OVERALL_STATUS = ["Active", "On Treatment", "Treatment Completed", "Lost to Follow-up", "Died", "Unknown"];

export default {
  title: "Tuberculosis Records",
  model: "health/models/tuberculosis.model.js",
  uniqueKeys: ["nikshaiId"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    {
      key: "nikshaiId",
      label: "NIKSHAY ID",
      type: "text",
      required: true,
      unique: true,
      headerAliases: ["NIKSHAI ID", "NISKHAI ID", "Nikshay ID"],
      hint: "Must be unique, e.g. NIK-2024-001",
    },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "occupation", label: "Occupation", type: "text" },

    // Household details
    { key: "householdCode", label: "Household Code", type: "text", required: true },
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

    // TB details
    {
      key: "typeOfTB",
      label: "Type of TB",
      type: "enum",
      options: TYPE_OF_TB,
      aliases: {
        "Extra-pulmonary TB": ["Extra Pulmonary TB", "EPTB"],
        "MDR TB": ["MDR-TB", "Drug Resistant TB", "DR-TB"],
        "XDR TB": ["XDR-TB"],
      },
    },
    { key: "dateOfMedicalScreening", label: "Date of Medical Screening", type: "date" },
    { key: "treatmentForTB", label: "Treatment for TB", type: "text", hint: "e.g. DOTS Category 1, MDR regimen" },
    {
      key: "expectedDateOfTreatmentCompletion",
      label: "Expected Treatment Completion Date",
      type: "date",
      headerAliases: ["Expected Completion Date"],
    },
    { key: "diagnosticDetails", label: "Diagnostic Details", type: "text" },
    { key: "comorbidities", label: "Comorbidities", type: "text" },
    { key: "nutritionStatus", label: "Nutrition Status", type: "enum", options: NUTRITION_STATUS },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },
    { key: "dateOfLinkageWithDOTS", label: "Date of Linkage with DOTS", type: "date" },

    // Treatment status
    {
      key: "overallStatus",
      label: "Overall Status",
      type: "enum",
      options: OVERALL_STATUS,
      aliases: {
        "Treatment Completed": ["Completed", "Cured"],
        "Lost to Follow-up": ["Lost to Follow Up", "LTFU", "Defaulted"],
        Died: ["Deceased"],
      },
    },
  ],
  sampleRow: {
    nikshaiId: "NIK-2024-001",
    name: "Bimal Roy",
    gender: "Male",
    age: 42,
    contactNo: "9876543210",
    occupation: "Rickshaw puller",
    householdCode: "HH-0921",
    headOfHousehold: "Bimal Roy",
    nameOfRespondant: "Mina Roy",
    contactNoOfRespondant: "9876543211",
    wardNo: "Ward 9",
    habitation: "Shyambazar",
    projectResponsible: "Dr. P. Mukherjee",
    dateOfReporting: "2024-03-01",
    reportedBy: "DOTS Provider",
    typeOfTB: "Pulmonary TB",
    dateOfMedicalScreening: "2024-02-15",
    treatmentForTB: "DOTS Category 1",
    expectedDateOfTreatmentCompletion: "2024-08-15",
    diagnosticDetails: "Sputum positive, chest X-ray confirmed",
    comorbidities: "Diabetes",
    nutritionStatus: "Underweight",
    individualCarePlan: "Daily DOTS, monthly weight check, nutrition kit",
    dateOfLinkageWithDOTS: "2024-03-05",
    overallStatus: "On Treatment",
  },
};
