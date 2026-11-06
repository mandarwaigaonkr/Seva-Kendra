// Excel import template — Education › Board Preparation
// Source of truth: sevaKendra-backend/src/modules/education/models/boardPreparation.model.js
// The service also rejects a householdCode that already exists (400 "Household code already exists").
// Verify with: node scripts/verify-import-templates.mjs boardPreparation

export const GENDER = ["Male", "Female", "Other"];
export const CATEGORY = ["SC", "ST", "OBC", "Muslim", "General", "Other"];
export const EDUCATIONAL_STANDARD = ["Class 10", "Class 12", "Graduation", "Post Graduation", "Diploma", "Other"];
export const EDUCATION_BOARD = ["WBBSE", "CBSE", "ICSE", "NIOS", "Other"];
export const STATUS = ["Preparing", "Appeared", "Passed", "Failed", "Discontinued"];

export default {
  title: "Board Preparation",
  model: "education/models/boardPreparation.model.js",
  uniqueKeys: ["householdCode"],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    { key: "householdCode", label: "Household Code", type: "text", required: true, unique: true, hint: "Must be unique — one record per household code" },
    { key: "name", label: "Name", type: "text", required: true, headerAliases: ["Student Name"] },
    { key: "gender", label: "Gender", type: "enum", required: true, options: GENDER, aliases: { Male: ["M", "Boy"], Female: ["F", "Girl"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, max: 144, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "category", label: "Category", type: "enum", options: CATEGORY, aliases: { General: ["Gen", "GN"], Muslim: ["Minority"] } },
    {
      key: "educationalStandard",
      label: "Educational Standard",
      type: "enum",
      required: true,
      options: EDUCATIONAL_STANDARD,
      aliases: {
        "Class 10": ["10", "10th", "10th (Secondary)", "Secondary", "Madhyamik", "Class X", "SSC"],
        "Class 12": ["12", "12th", "12th (Higher Secondary)", "Higher Secondary", "HS", "Class XII", "HSC"],
        "Post Graduation": ["PG", "Post Graduate"],
        Graduation: ["UG", "Graduate"],
      },
    },
    {
      key: "educationBoard",
      label: "Education Board",
      type: "enum",
      options: EDUCATION_BOARD,
      aliases: { Other: ["WBCHSE", "ISC", "State Board"] },
      hint: "Other boards (e.g. WBCHSE, ISC): choose Other and write the board in “Other Board”. Blank = WBBSE",
    },
    { key: "educationBoardOther", label: "Other Board", type: "text", headerAliases: ["Education Board (Other)"] },
    { key: "status", label: "Status", type: "enum", options: STATUS, hint: "Blank = Preparing" },
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },
    { key: "dateOfEducationalAssessment", label: "Date of Educational Assessment", type: "date" },
    { key: "educationalScreeningResults", label: "Educational Screening Results", type: "text" },
    { key: "dateOfCareerCounselling", label: "Date of Career Counselling", type: "date" },
    { key: "counselingReport", label: "Counselling Report", type: "text", headerAliases: ["Counseling Report"] },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },
  ],
  sampleRow: {
    householdCode: "HH-1503",
    name: "Priya Das",
    gender: "Female",
    age: 16,
    contactNo: "9830012345",
    headOfHousehold: "Subrata Das",
    wardNo: "Ward 15",
    habitation: "Tiljala",
    projectResponsible: "Education Coordinator A",
    category: "SC",
    educationalStandard: "Class 10",
    educationBoard: "WBBSE",
    educationBoardOther: "",
    status: "Preparing",
    dateOfReporting: "2024-06-10",
    reportedBy: "Field Worker C",
    dateOfEducationalAssessment: "2024-06-20",
    educationalScreeningResults: "Weak in maths, good in languages",
    dateOfCareerCounselling: "2024-07-05",
    counselingReport: "Interested in nursing; needs science tuition",
    individualCarePlan: "Twice-weekly maths tuition, mock tests monthly",
  },
};
