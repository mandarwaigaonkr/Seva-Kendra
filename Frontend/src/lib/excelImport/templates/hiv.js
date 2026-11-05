// Excel import template — Health › HIV
// Source of truth: sevaKendra-backend/src/modules/health/models/hiv.model.js
// Verify with: node scripts/verify-import-templates.mjs hiv

const GENDER = ["Male", "Female", "Other"];
const HIV_STAGE = ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Unknown"];
const NUTRITION_STATUS = ["Normal", "Underweight", "Overweight", "Malnourished", "Severely Malnourished"];
const TREATMENT_STATUS = ["Not Started", "On ART", "Treatment Interrupted", "Stopped", "Completed"];
const OVERALL_STATUS = ["Active", "On Treatment", "Lost to Follow-up", "Died", "Unknown"];

export default {
  title: "HIV Records",
  model: "health/models/hiv.model.js",
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
      hint: "Must be unique across HIV records (one record per household code)",
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

    // HIV details
    {
      key: "hivStage",
      label: "HIV Stage",
      type: "enum",
      options: HIV_STAGE,
      aliases: { "Stage 1": ["1", "I"], "Stage 2": ["2", "II"], "Stage 3": ["3", "III"], "Stage 4": ["4", "IV"] },
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
        "Not Started": ["Pre-ART", "Pre ART"],
        Stopped: ["Stopped Treatment"],
        "Treatment Interrupted": ["Interrupted"],
      },
    },
    {
      key: "overallStatus",
      label: "Overall Status",
      type: "enum",
      options: OVERALL_STATUS,
      aliases: { "Lost to Follow-up": ["Lost to Follow Up", "LTFU"], Died: ["Deceased"] },
    },
  ],
  sampleRow: {
    name: "Ananya Das",
    gender: "Female",
    age: 30,
    contactNo: "9876543210",
    occupation: "Domestic worker",
    householdCode: "HH-0611",
    headOfHousehold: "Subrata Das",
    nameOfRespondant: "Ananya Das",
    contactNoOfRespondant: "9876543212",
    wardNo: "Ward 6",
    habitation: "Gariahat",
    projectResponsible: "Dr. K. Saha",
    dateOfReporting: "2024-03-05",
    reportedBy: "Counselor A",
    hivStage: "Stage 2",
    durationOfIllness: 36,
    diagnosticDetails: "Confirmed at ICTC, CD4 count 420",
    comorbidities: "Anaemia",
    nutritionStatus: "Underweight",
    individualCarePlan: "Monthly ART pickup, nutrition support, counselling",
    statusOfTreatment: "On ART",
    overallStatus: "On Treatment",
  },
};
