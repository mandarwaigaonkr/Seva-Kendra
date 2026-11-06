// Excel import template — Health › Persons with Disabilities (PWD)
// Source of truth: sevaKendra-backend/src/modules/health/models/pwd.model.js
// Verify with: node scripts/verify-import-templates.mjs pwd

const GENDER = ["Male", "Female", "Other"];
const DISABILITY_TYPES = [
  "Visual Impairment",
  "Hearing Impairment",
  "Locomotor Disability",
  "Intellectual Disability",
  "Mental Illness",
  "Multiple Disabilities",
  "Speech and Language Disability",
  "Autism Spectrum Disorder",
  "Cerebral Palsy",
  "Muscular Dystrophy",
  "Chronic Neurological Conditions",
  "Leprosy Cured",
  "Dwarfism",
  "Acid Attack Victim",
  "Other",
];
const CERTIFICATE = ["Available", "Not Available", "In Process", "Expired"];
const UDID = ["Yes", "No", "Applied", "Not Applicable"];
const EMPLOYMENT = ["Employed", "Unemployed", "Self-Employed", "Student", "Retired", "Other"];
const PENSION = ["Receiving", "Not Receiving", "Applied", "Rejected", "Unknown"];

export default {
  title: "PWD Records",
  model: "health/models/pwd.model.js",
  uniqueKeys: ["householdCode", "uniqueId"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    { key: "householdCode", label: "Household Code", type: "text", required: true, unique: true, hint: "Must be unique, e.g. HH-501" },
    { key: "uniqueId", label: "Unique ID", type: "text", required: true, unique: true, hint: "Must be unique, e.g. PWD-001" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "district", label: "District", type: "text", required: true },
    { key: "state", label: "State", type: "text", required: true },

    // Disability details
    {
      key: "typeOfDisability",
      label: "Type of Disability",
      type: "multiEnum",
      required: true,
      options: DISABILITY_TYPES,
      aliases: {
        "Visual Impairment": ["Visual", "Blind", "Blindness", "Low Vision"],
        "Hearing Impairment": ["Hearing", "Deaf"],
        "Locomotor Disability": ["Locomotor", "Physical", "Orthopaedic", "Orthopedic"],
        "Intellectual Disability": ["Intellectual", "Mental Retardation"],
        "Mental Illness": ["Mental"],
        "Multiple Disabilities": ["Multiple"],
        "Speech and Language Disability": ["Speech", "Speech & Language Disability"],
        "Autism Spectrum Disorder": ["Autism", "ASD"],
        "Cerebral Palsy": ["CP"],
      },
      headerAliases: ["Disability Type", "Type of Disabilities"],
      hint: "One or more types separated by commas",
    },
    {
      key: "percentageOfDisability",
      label: "Percentage of Disability",
      type: "number",
      required: true,
      min: 0,
      max: 100,
      headerAliases: ["Disability %", "Disability Percentage"],
      hint: "0 to 100, as on the certificate",
    },
    {
      key: "disabilityCertificate",
      label: "Disability Certificate",
      type: "enum",
      required: true,
      options: CERTIFICATE,
      aliases: { Available: ["Yes", "Y"], "Not Available": ["No", "N"], "In Process": ["Applied", "In Progress"] },
    },
    {
      key: "udidCardStatus",
      label: "UDID Card Status",
      type: "enum",
      options: UDID,
      aliases: { Yes: ["Issued", "Available", "Y"], No: ["Not Applied", "N"], "Not Applicable": ["NA", "N/A"] },
      headerAliases: ["UDID Status", "UDID Card"],
      hint: "Defaults to No when left blank",
    },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Assessment and support
    { key: "dateOfAssessment", label: "Date of Assessment", type: "date" },
    { key: "assessmentResults", label: "Assessment Results", type: "text" },
    { key: "assistiveDevicesProvided", label: "Assistive Devices Provided", type: "text", headerAliases: ["Assistive Devices"] },
    { key: "therapyServices", label: "Therapy Services", type: "text" },
    {
      key: "rehabilitationServices",
      label: "Rehabilitation Services",
      type: "text",
      hint: "Left blank: copied from Institutional Care (same as the form)",
    },
    { key: "institutionalCare", label: "Institutional Care", type: "text" },
    { key: "educationalSupport", label: "Educational Support", type: "text" },
    { key: "vocationalTraining", label: "Vocational Training", type: "text" },
    {
      key: "employmentStatus",
      label: "Employment Status",
      type: "enum",
      options: EMPLOYMENT,
      aliases: { "Self-Employed": ["Self Employed", "Self-employment"] },
    },

    // Government schemes
    { key: "beneficiaryOfGovernmentSchemes", label: "Beneficiary of Government Schemes", type: "text", headerAliases: ["Government Schemes", "Remarks"] },
    {
      key: "pensionStatus",
      label: "Pension Status",
      type: "enum",
      options: PENSION,
      aliases: { Receiving: ["Yes", "Received"], "Not Receiving": ["No"] },
    },
  ],
  sampleRow: {
    householdCode: "HH-501",
    uniqueId: "PWD-001",
    name: "Suresh Roy",
    gender: "Male",
    age: 35,
    contactNo: "9876543210",
    headOfHousehold: "Gopal Roy",
    wardNo: "Ward 7",
    habitation: "Khidderpore",
    projectResponsible: "Sunita Das",
    district: "Kolkata",
    state: "West Bengal",
    typeOfDisability: "Locomotor Disability",
    percentageOfDisability: 60,
    disabilityCertificate: "Available",
    udidCardStatus: "Applied",
    dateOfReporting: "2024-02-01",
    reportedBy: "Field Worker B",
    dateOfAssessment: "2024-02-15",
    assessmentResults: "Lower limb weakness, needs mobility aid",
    assistiveDevicesProvided: "Wheelchair",
    therapyServices: "Weekly physiotherapy",
    rehabilitationServices: "Community-based rehabilitation",
    institutionalCare: "None",
    educationalSupport: "Not applicable",
    vocationalTraining: "Mobile repair course enrolled",
    employmentStatus: "Unemployed",
    beneficiaryOfGovernmentSchemes: "Manabik disability pension (applied)",
    pensionStatus: "Applied",
  },
  // The form mirrors Institutional Care into Rehabilitation Services; keep imports consistent.
  transform: (payload) => {
    if (!payload.rehabilitationServices && payload.institutionalCare) {
      payload.rehabilitationServices = payload.institutionalCare;
    }
    return payload;
  },
};
