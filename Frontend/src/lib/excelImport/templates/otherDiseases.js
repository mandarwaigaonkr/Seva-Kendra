// Excel import template — Health › Other Diseases
// Source of truth: sevaKendra-backend/src/modules/health/models/otherDiseases.model.js
// Verify with: node scripts/verify-import-templates.mjs otherDiseases

const GENDER = ["Male", "Female", "Other"];
const OVERALL_STATUS = ["Active", "Under Treatment", "Recovered", "Lost to Follow-up", "Died", "Unknown"];

export default {
  title: "Other Diseases Records",
  model: "health/models/otherDiseases.model.js",
  uniqueKeys: [],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    { key: "name", label: "Name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "occupation", label: "Occupation", type: "text" },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Disease details
    { key: "natureOfIssue", label: "Nature of Issue", type: "text", hint: "e.g. Hypertension, Diabetes, Malaria" },
    { key: "dateOfMedicalScreening", label: "Date of Medical Screening", type: "date" },
    { key: "screeningResults", label: "Screening Results", type: "text" },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },

    // Treatment status
    { key: "nameOfInstitution", label: "Name of Institution", type: "text", headerAliases: ["Institution", "Hospital"] },
    { key: "dateOfAdmission", label: "Date of Admission", type: "date" },
    {
      key: "overallStatus",
      label: "Overall Status",
      type: "enum",
      options: OVERALL_STATUS,
      aliases: {
        "Under Treatment": ["On Treatment", "Stable"],
        "Lost to Follow-up": ["Lost to Follow Up", "LTFU"],
        Died: ["Deceased"],
      },
    },
  ],
  sampleRow: {
    name: "Meena Ghosh",
    gender: "Female",
    age: 45,
    contactNo: "9876543210",
    occupation: "Tailor",
    headOfHousehold: "Prabir Ghosh",
    wardNo: "Ward 10",
    habitation: "Tollygunge",
    projectResponsible: "Dr. A. Roy",
    dateOfReporting: "2024-02-28",
    reportedBy: "Field Worker F",
    natureOfIssue: "Hypertension",
    dateOfMedicalScreening: "2024-02-25",
    screeningResults: "BP 160/100, ECG normal",
    individualCarePlan: "Daily medication, monthly BP check, low-salt diet counselling",
    nameOfInstitution: "Tollygunge Urban PHC",
    dateOfAdmission: "2024-02-26",
    overallStatus: "Under Treatment",
  },
};
