// Excel import template — Education › Schools
// Source of truth: sevaKendra-backend/src/modules/education/models/school.model.js
// Verify with: node scripts/verify-import-templates.mjs school

const EDUCATION_LEVEL = ["Primary", "Upper Primary", "Secondary", "Higher Secondary", "All Levels"];
const TYPE_OF_STUDENTS = ["Boys", "Girls", "Co-educational"];
const ACTION_PLAN_STATUS = ["Planned", "Ongoing", "Completed"];

export default {
  title: "Schools",
  model: "education/models/school.model.js",
  uniqueKeys: ["schoolCode"],
  // Monthly progress notes are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    { key: "schoolCode", label: "School Code", type: "text", required: true, unique: true, hint: "Must be unique, e.g. SCH-001" },
    { key: "schoolName", label: "School Name", type: "text", required: true },
    // The form stores "Ward N" (getWardOptions); the model has no enum but expects the same format.
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    {
      key: "educationLevel",
      label: "Education Level",
      type: "enum",
      required: true,
      options: EDUCATION_LEVEL,
      aliases: { "Higher Secondary": ["HSS", "Senior Secondary"], "Upper Primary": ["Middle", "Middle School"], "All Levels": ["All"] },
    },
    {
      key: "typeOfStudents",
      label: "Type of Students",
      type: "enum",
      required: true,
      options: TYPE_OF_STUDENTS,
      aliases: { "Co-educational": ["Co-ed", "Coed", "Co education", "Mixed"] },
    },
    { key: "schoolTimings", label: "School Timings", type: "text", required: true, headerAliases: ["Timings", "Timing"], hint: "e.g. 9:00 AM - 3:00 PM" },
    { key: "mediumOfInstruction", label: "Medium of Instruction", type: "text", required: true, headerAliases: ["Medium"], hint: "e.g. Kannada, English" },
    { key: "totalStudents", label: "Total Students", type: "integer", required: true, min: 0 },
    { key: "principalName", label: "Principal Name", type: "text", required: true, headerAliases: ["Headmaster Name", "Headmaster", "Principal"] },
    {
      key: "principalContact",
      label: "Principal Contact",
      type: "phone",
      required: true,
      headerAliases: ["Contact Number", "Contact No", "Principal Phone"],
    },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "keyIssueIdentified", label: "Key Issue Identified", type: "text", required: true, headerAliases: ["Key Issue"] },
    { key: "actionPlan", label: "Action Plan", type: "text", required: true },
    {
      key: "statusOfActionPlanImplementation",
      label: "Action Plan Status",
      type: "enum",
      options: ACTION_PLAN_STATUS,
      aliases: { Ongoing: ["In Progress"], Completed: ["Done"] },
      headerAliases: ["Status of Action Plan Implementation", "Status"],
      hint: "Defaults to Planned",
    },
  ],
  sampleRow: {
    schoolCode: "SCH-001",
    schoolName: "Government Higher Primary School, Ejipura",
    wardNo: "Ward 10",
    educationLevel: "Upper Primary",
    typeOfStudents: "Co-educational",
    schoolTimings: "9:00 AM - 3:30 PM",
    mediumOfInstruction: "Kannada",
    totalStudents: 450,
    principalName: "Smt. Lakshmi Narayan",
    principalContact: "9876543210",
    projectResponsible: "Amit Sen",
    keyIssueIdentified: "Low attendance among girls in Classes 6-7",
    actionPlan: "Monthly parent meetings and after-school remedial classes",
    statusOfActionPlanImplementation: "Ongoing",
  },
};
