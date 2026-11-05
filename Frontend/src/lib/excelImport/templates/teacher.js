// Excel import template — Education › Teachers
// Source of truth: sevaKendra-backend/src/modules/education/models/teacher.model.js
// Verify with: node scripts/verify-import-templates.mjs teacher

const SPECIALIZATION = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Physical Education",
  "Computer Science",
  "Arts",
  "Vocational",
  "General",
  "Other",
];
const STATUS = ["Active", "Inactive", "On Leave"];

const splitList = (value) =>
  String(value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default {
  title: "Teachers",
  model: "education/models/teacher.model.js",
  uniqueKeys: ["teacherId"],
  // studyCenters (ObjectId refs) is set from the Study Centers screen, not the import.
  excluded: ["studyCenters"],
  fields: [
    { key: "teacherId", label: "Teacher ID", type: "text", unique: true, hint: "Optional, must be unique if given, e.g. TCH-001" },
    { key: "firstName", label: "First Name", type: "text", required: true },
    { key: "lastName", label: "Last Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phoneNumber", label: "Phone Number", type: "phone", required: true, headerAliases: ["Phone", "Mobile", "Contact Number"] },
    {
      key: "specialization",
      label: "Specialization",
      type: "multiEnum",
      options: SPECIALIZATION,
      aliases: { Mathematics: ["Maths", "Math"], "Social Studies": ["Social Science", "SST"], "Computer Science": ["Computers", "Computer"], "Physical Education": ["PE", "Sports"] },
      headerAliases: ["Specializations", "Subjects"],
      hint: "One or more, separated by commas. Defaults to General when blank.",
    },
    { key: "experience", label: "Experience (years)", type: "number", min: 0, headerAliases: ["Years of Experience", "Experience"] },
    {
      key: "qualifications",
      label: "Qualifications",
      type: "text",
      headerAliases: ["Qualification"],
      hint: "Free text; separate several with commas, e.g. B.Ed, M.A. English",
    },
    { key: "status", label: "Status", type: "enum", options: STATUS, aliases: { "On Leave": ["Leave"] }, hint: "Defaults to Active" },
  ],
  sampleRow: {
    teacherId: "TCH-001",
    firstName: "Anjali",
    lastName: "Roy",
    email: "anjali.roy@example.com",
    phoneNumber: "9876543210",
    specialization: ["Mathematics", "Science"],
    experience: 5,
    qualifications: "B.Ed, M.Sc Mathematics",
    status: "Active",
  },
  // qualifications is an array of strings in the model.
  transform: (payload) => {
    if (typeof payload.qualifications === "string") payload.qualifications = splitList(payload.qualifications);
    return payload;
  },
};
