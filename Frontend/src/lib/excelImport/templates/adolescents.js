// Excel import template — Health › Adolescents
// Source of truth: sevaKendra-backend/src/modules/health/models/adolescents.model.js
// Verify with: node scripts/verify-import-templates.mjs adolescents

const GENDER = ["Male", "Female", "Other"];
const EDUCATION_STATUS = ["In School", "Dropped Out", "Completed", "Never Enrolled", "Vocational Training"];
const NUTRITIONAL_STATUS = ["Normal", "Underweight", "Overweight", "Obese", "Severely Underweight"];
const MENSTRUAL_HYGIENE = ["Good", "Poor", "Fair", "Not Applicable"];
const REPRODUCTIVE_HEALTH_EDUCATION = ["Provided", "Not Provided", "Partially Provided", "Refused"];
const MENTAL_HEALTH_SCREENING = ["Normal", "At Risk", "Needs Support", "Referred", "Not Assessed"];
const COUNSELING_PROVIDED = ["Yes", "No", "In Progress", "Referred"];
const LIFE_SKILLS_TRAINING = ["Completed", "In Progress", "Not Started", "Dropped Out"];
const PEER_EDUCATOR_ROLE = ["Yes", "No", "Training", "Interested"];
const SUBSTANCE_USE = ["None", "Tobacco", "Alcohol", "Drugs", "Multiple", "Unknown"];

export default {
  title: "Adolescent Records",
  model: "health/models/adolescents.model.js",
  uniqueKeys: ["householdCode", "uniqueId"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    {
      key: "householdCode",
      label: "Household Code",
      type: "text",
      required: true,
      unique: true,
      hint: "Must be unique across adolescent records, e.g. HH-601",
    },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "uniqueId", label: "Unique ID", type: "text", required: true, unique: true, hint: "Must be unique, e.g. ADO-001" },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 10, max: 19, hint: "Adolescents only: 10 to 19 years" },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Education
    {
      key: "educationStatus",
      label: "Education Status",
      type: "enum",
      required: true,
      options: EDUCATION_STATUS,
      aliases: { Completed: ["Completed Education"], "Vocational Training": ["Vocational"] },
    },
    { key: "currentClass", label: "Current Class", type: "text", headerAliases: ["Class"] },
    { key: "schoolName", label: "School Name", type: "text", headerAliases: ["School"] },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Health assessment
    { key: "dateOfHealthScreening", label: "Date of Health Screening", type: "date" },
    { key: "heightCm", label: "Height (cm)", type: "number", min: 50, max: 250, headerAliases: ["Height"] },
    { key: "weightKg", label: "Weight (kg)", type: "number", min: 10, max: 200, headerAliases: ["Weight"] },
    { key: "bmi", label: "BMI", type: "number", min: 10, max: 50 },
    { key: "nutritionalStatus", label: "Nutritional Status", type: "enum", options: NUTRITIONAL_STATUS },

    // Sexual and reproductive health
    {
      key: "menstrualHygiene",
      label: "Menstrual Hygiene",
      type: "enum",
      options: MENSTRUAL_HYGIENE,
      aliases: { Fair: ["Needs Improvement"], "Not Applicable": ["NA", "N/A"] },
    },
    { key: "reproductiveHealthEducation", label: "Reproductive Health Education", type: "enum", options: REPRODUCTIVE_HEALTH_EDUCATION },

    // Mental health
    {
      key: "mentalHealthScreening",
      label: "Mental Health Screening",
      type: "enum",
      options: MENTAL_HEALTH_SCREENING,
      aliases: { Referred: ["Under Treatment"] },
    },
    { key: "counselingProvided", label: "Counseling Provided", type: "enum", options: COUNSELING_PROVIDED, aliases: { "In Progress": ["Ongoing"] } },

    // Life skills and development
    {
      key: "lifeSkillsTraining",
      label: "Life Skills Training",
      type: "enum",
      options: LIFE_SKILLS_TRAINING,
      aliases: { "In Progress": ["Ongoing"] },
    },
    { key: "vocationalSkills", label: "Vocational Skills", type: "text" },
    { key: "peerEducatorRole", label: "Peer Educator Role", type: "enum", options: PEER_EDUCATOR_ROLE, aliases: { Training: ["In Training"] } },

    // Risk factors
    {
      key: "substanceUse",
      label: "Substance Use",
      type: "enum",
      options: SUBSTANCE_USE,
      aliases: { Multiple: ["Multiple Substances"] },
    },
    { key: "socialIssues", label: "Social Issues", type: "text" },
  ],
  sampleRow: {
    householdCode: "HH-601",
    name: "Priya Mondal",
    uniqueId: "ADO-001",
    gender: "Female",
    age: 15,
    contactNo: "9876543210",
    headOfHousehold: "Ratan Mondal",
    wardNo: "Ward 3",
    habitation: "Belgachia",
    projectResponsible: "Anita Sen",
    educationStatus: "In School",
    currentClass: "Class 9",
    schoolName: "Belgachia Girls High School",
    dateOfReporting: "2024-01-20",
    reportedBy: "Field Worker C",
    dateOfHealthScreening: "2024-01-18",
    heightCm: 152,
    weightKg: 41,
    bmi: 17.7,
    nutritionalStatus: "Underweight",
    menstrualHygiene: "Fair",
    reproductiveHealthEducation: "Provided",
    mentalHealthScreening: "Normal",
    counselingProvided: "Yes",
    lifeSkillsTraining: "In Progress",
    vocationalSkills: "Tailoring basics",
    peerEducatorRole: "Interested",
    substanceUse: "None",
    socialIssues: "Irregular attendance during exam season",
  },
};
