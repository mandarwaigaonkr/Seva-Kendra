// Excel import template — Education › Group Leaders
// Source of truth: sevaKendra-backend/src/modules/education/models/groupLeader.model.js
// Verify with: node scripts/verify-import-templates.mjs groupLeader

const QUALIFICATIONS = [
  "Illiterate",
  "Neo-literate",
  "Primary",
  "Secondary",
  "Higher Secondary",
  "Graduate",
  "Post-Graduate",
  "Other",
];
const STATUS = ["Active", "Inactive", "On Leave"];

export default {
  title: "Group Leaders",
  model: "education/models/groupLeader.model.js",
  uniqueKeys: ["leaderId"],
  // assignedStudyCenters (ObjectId refs) is set from the Study Centers screen, not the import.
  excluded: ["assignedStudyCenters"],
  fields: [
    { key: "leaderId", label: "Leader ID", type: "text", unique: true, hint: "Optional, must be unique if given, e.g. LDR-001" },
    { key: "firstName", label: "First Name", type: "text", required: true },
    { key: "lastName", label: "Last Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email" },
    { key: "phoneNumber", label: "Phone Number", type: "phone", required: true, headerAliases: ["Phone", "Mobile", "Contact Number"] },
    { key: "experience.years", label: "Years of Experience", type: "number", min: 0, headerAliases: ["Experience (years)", "Experience"] },
    { key: "experience.domain", label: "Domain of Experience", type: "text", headerAliases: ["Experience Domain"], hint: "e.g. Education, Community Work" },
    {
      key: "qualifications",
      label: "Qualification",
      type: "enum",
      options: QUALIFICATIONS,
      aliases: {
        "Post-Graduate": ["Post Graduate", "PG", "Postgraduate"],
        Graduate: ["UG", "Graduation", "Bachelors"],
        "Higher Secondary": ["12th", "HSC", "Class 12", "PUC"],
        Secondary: ["10th", "SSLC", "SSC", "Class 10"],
        "Neo-literate": ["Neo literate"],
      },
      headerAliases: ["Qualifications"],
      hint: "Defaults to Other",
    },
    { key: "status", label: "Status", type: "enum", options: STATUS, aliases: { "On Leave": ["Leave"] }, hint: "Defaults to Active" },
  ],
  sampleRow: {
    leaderId: "LDR-001",
    firstName: "Sujata",
    lastName: "Roy",
    email: "sujata.roy@example.com",
    phoneNumber: "9876543210",
    "experience.years": 4,
    "experience.domain": "Community Organizing",
    qualifications: "Graduate",
    status: "Active",
  },
};
