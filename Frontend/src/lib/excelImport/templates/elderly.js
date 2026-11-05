// Excel import template — Health › Elderly
// Source of truth: sevaKendra-backend/src/modules/health/models/elderly.model.js
// Verify with: node scripts/verify-import-templates.mjs elderly

const GENDER = ["Male", "Female", "Other"];
const BANK_ACCOUNT = ["Available", "Not Available", "In Process", "Blocked", "Other"];

const splitList = (value) =>
  String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default {
  title: "Elderly Records",
  model: "health/models/elderly.model.js",
  uniqueKeys: ["householdCode", "uniqueId"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    { key: "householdCode", label: "Household Code", type: "text", required: true, unique: true, hint: "Must be unique, e.g. HH-701" },
    { key: "uniqueId", label: "Unique ID", type: "text", required: true, unique: true, hint: "Must be unique, e.g. ELD-001" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 60, max: 120, hint: "60 or above" },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    {
      key: "nameOfLocalSelfGovernment",
      label: "Name of Local Self Government",
      type: "text",
      required: true,
      headerAliases: ["Local Self Government", "LSG", "Panchayat / Municipality"],
    },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Assessment
    { key: "dateOfMedicalScreening", label: "Date of Medical Screening", type: "date", headerAliases: ["Medical Screening Date"] },
    { key: "medicalScreeningResults", label: "Medical Screening Results", type: "text" },
    {
      key: "dateOfPsychologicalAssessment",
      label: "Date of Psychological Assessment",
      type: "date",
      headerAliases: ["Psychological Assessment Date"],
    },
    { key: "psychologicalScreeningResults", label: "Psychological Screening Results", type: "text" },
    {
      key: "natureOfIssue",
      label: "Nature of Issue",
      type: "text",
      hint: "One or more issues separated by commas, e.g. Chronic Disease, Mobility Issues",
    },
    {
      key: "statusOfBankAccount",
      label: "Bank Account Status",
      type: "enum",
      options: BANK_ACCOUNT,
      aliases: { Available: ["Yes", "Y"], "Not Available": ["No", "N", "None"], "In Process": ["In Progress", "Applied"] },
      headerAliases: ["Has Bank Account", "Status of Bank Account", "Bank Account"],
    },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },
  ],
  sampleRow: {
    householdCode: "HH-701",
    uniqueId: "ELD-001",
    name: "Ram Chandra Das",
    gender: "Male",
    age: 72,
    contactNo: "9876543210",
    headOfHousehold: "Suresh Das",
    wardNo: "Ward 12",
    habitation: "Santipara",
    projectResponsible: "Rekha Devi",
    nameOfLocalSelfGovernment: "Bally Municipality",
    dateOfReporting: "2024-01-10",
    reportedBy: "Field Worker A",
    dateOfMedicalScreening: "2024-01-20",
    medicalScreeningResults: "BP 150/95, early cataract in left eye",
    dateOfPsychologicalAssessment: "2024-01-25",
    psychologicalScreeningResults: "Mild loneliness, no signs of depression",
    natureOfIssue: "Chronic Disease, Social Isolation",
    statusOfBankAccount: "Available",
    individualCarePlan: "Monthly BP check, link to old-age pension, weekly home visit",
  },
  // natureOfIssue is [String] in the model; the sheet holds a comma-separated list.
  transform: (payload) => {
    if (payload.natureOfIssue !== undefined) payload.natureOfIssue = splitList(payload.natureOfIssue);
    return payload;
  },
};
