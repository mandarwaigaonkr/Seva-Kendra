// Excel import template — Health › Addiction
// Source of truth: sevaKendra-backend/src/modules/health/models/addiction.model.js
// Verify with: node scripts/verify-import-templates.mjs addiction

const GENDER = ["Male", "Female", "Other"];
const SKILL_LINKAGE = ["Not Linked", "In Progress", "Linked", "Completed", "Dropped Out"];
const OVERALL_STATUS = ["Active", "In Rehabilitation", "Recovered", "Relapsed", "Lost to Follow-up", "Unknown"];

export default {
  title: "Addiction Records",
  model: "health/models/addiction.model.js",
  uniqueKeys: ["caseId"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    { key: "caseId", label: "Case ID", type: "text", required: true, unique: true, hint: "Must be unique, e.g. ADD-001" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "occupation", label: "Occupation", type: "text" },

    // Household details
    { key: "householdCode", label: "Household Code", type: "text" },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "nameOfRespondant", label: "Name of Respondent", type: "text", headerAliases: ["Name of Respondant"] },
    { key: "contactNoOfRespondant", label: "Respondent Contact Number", type: "phone", headerAliases: ["Contact No of Respondant"] },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Addiction details
    { key: "typeOfSubstancesUsed", label: "Type of Substances Used", type: "text", headerAliases: ["Substance Type", "Substance"], hint: "e.g. Alcohol, Tobacco, Cannabis" },
    { key: "durationOfUse", label: "Duration of Use (months)", type: "number", min: 0, headerAliases: ["Duration of Use"] },
    { key: "diagnosticDetails", label: "Diagnostic Details", type: "text" },
    { key: "comorbidities", label: "Comorbidities", type: "text" },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },

    // Rehabilitation
    { key: "nameOfInstitution", label: "Name of Institution", type: "text" },
    { key: "dateOfAdmission", label: "Date of Admission", type: "date" },
    { key: "dateOfRelease", label: "Date of Release", type: "date" },
    {
      key: "statusOfLinkageWithSkillDevelopment",
      label: "Skill Development Linkage",
      type: "enum",
      options: SKILL_LINKAGE,
      headerAliases: ["Skill Development Status", "Status of Linkage with Skill Development"],
    },
    {
      key: "overallStatus",
      label: "Overall Status",
      type: "enum",
      options: OVERALL_STATUS,
      aliases: { "Lost to Follow-up": ["Lost to Follow Up", "LTFU"], "In Rehabilitation": ["Rehab", "In Rehab"] },
    },
  ],
  sampleRow: {
    caseId: "ADD-001",
    name: "Raju Sharma",
    gender: "Male",
    age: 28,
    contactNo: "9876543210",
    occupation: "Daily wage labourer",
    householdCode: "HH-0412",
    headOfHousehold: "Mohan Sharma",
    nameOfRespondant: "Sita Sharma",
    contactNoOfRespondant: "9876501234",
    wardNo: "Ward 4",
    habitation: "Howrah",
    projectResponsible: "Counselor B",
    dateOfReporting: "2024-01-25",
    reportedBy: "Field Worker E",
    typeOfSubstancesUsed: "Alcohol",
    durationOfUse: 18,
    diagnosticDetails: "Alcohol use disorder, moderate",
    comorbidities: "Hypertension",
    individualCarePlan: "Weekly counselling, family sessions",
    nameOfInstitution: "Navjeevan Rehab Centre",
    dateOfAdmission: "2024-02-01",
    dateOfRelease: "2024-04-30",
    statusOfLinkageWithSkillDevelopment: "In Progress",
    overallStatus: "In Rehabilitation",
  },
};
