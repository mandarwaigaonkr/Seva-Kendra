// Excel import template — Education › Study Centers
// Source of truth: sevaKendra-backend/src/modules/education/models/studyCenter.model.js
// Verify with: node scripts/verify-import-templates.mjs studyCenter
//
// The model requires `groupLeader` (an ObjectId ref to GroupLeader) and stores `teachers` as
// ObjectId refs. A spreadsheet can't carry ids, so the sheet takes the leader / teacher NAMES
// (and optional phones) in the legacy string columns `groupLeaderName`, `groupLeaderContact`,
// `teacherNames`, `teacherContacts`. StudyCenters.jsx resolves them to existing records (by phone,
// then by name) or creates them — the same thing the form does for manually typed names — and
// sends `groupLeader` / `teachers` ids to the API. See `resolvedRefs` below.

const INFRASTRUCTURE = ["Own Building", "Rented", "Community Hall", "School Premises", "Temple/Church", "Other"];
const LEVELS = ["Class 1-5", "Class 6-8", "Class 9-10", "Class 11-12", "College", "Other"];
const INFRA_QUALITY = ["Excellent", "Good", "Average", "Poor", "Needs Improvement"];
const TEACHER_ATTENDANCE = ["Regular", "Irregular", "Needs Monitoring"];
const ENGAGEMENT = ["High", "Medium", "Low"];
const LEARNING_OUTCOME = ["Excellent", "Good", "Satisfactory", "Needs Improvement"];
const COMMUNITY = ["Active", "Moderate", "Low"];

const splitList = (value) =>
  String(value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default {
  title: "Study Centers",
  model: "education/models/studyCenter.model.js",
  uniqueKeys: ["centreCode"],
  // Required ObjectId refs that the page fills in (from groupLeaderName / teacherNames) before POSTing.
  resolvedRefs: ["groupLeader", "teachers"],
  // Monthly progress notes are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    { key: "centreCode", label: "Centre Code", type: "text", required: true, unique: true, headerAliases: ["Center Code"], hint: "Must be unique, e.g. SC-001" },
    { key: "centreName", label: "Centre Name", type: "text", required: true, headerAliases: ["Center Name"] },
    { key: "sourceOfFunding", label: "Source of Funding", type: "text", required: true, headerAliases: ["Funding Source", "Funding"], hint: "e.g. CSR - Infosys Foundation" },
    {
      key: "infrastructure",
      label: "Infrastructure",
      type: "enum",
      required: true,
      options: INFRASTRUCTURE,
      aliases: { "Own Building": ["Own"], "Temple/Church": ["Temple", "Church", "Mosque", "Place of Worship"], "School Premises": ["School"] },
    },
    { key: "timing", label: "Timing", type: "text", required: true, headerAliases: ["Timings"], hint: "e.g. 4:00 PM - 6:00 PM" },
    {
      key: "studentsLevelOfEducation",
      label: "Students Level of Education",
      type: "multiEnum",
      required: true,
      options: LEVELS,
      aliases: { "Class 1-5": ["1-5", "Primary"], "Class 6-8": ["6-8", "Upper Primary"], "Class 9-10": ["9-10", "Secondary"], "Class 11-12": ["11-12", "Higher Secondary", "PUC"] },
      headerAliases: ["Level of Education", "Student Levels"],
      hint: "One or more, separated by commas",
    },
    // Model enum is "Ward 1".."Ward 144"; the ward type stores exactly that format.
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, max: 144, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "dateOfEstablishment", label: "Date of Establishment", type: "date", required: true, headerAliases: ["Established On", "Start Date"] },
    { key: "totalStudents", label: "Total Students", type: "integer", required: true, min: 0 },

    // People — resolved to GroupLeader / Teacher records by the page (see header comment).
    {
      key: "groupLeaderName",
      label: "Group Leader Name",
      type: "text",
      required: true,
      headerAliases: ["Group Leader"],
      hint: "Full name. Matched to an existing group leader (by phone, then name); a new one is created if none matches.",
    },
    {
      key: "groupLeaderContact",
      label: "Group Leader Contact",
      type: "phone",
      headerAliases: ["Group Leader Phone"],
      hint: "10-digit mobile. Recommended — used to match the leader and saved on a newly created one.",
    },
    {
      key: "teacherNames",
      label: "Teacher Names",
      type: "text",
      headerAliases: ["Teachers", "Teacher Name"],
      hint: "Separate several with commas. Each is matched to an existing teacher or created.",
    },
    {
      key: "teacherContacts",
      label: "Teacher Contacts",
      type: "text",
      headerAliases: ["Teacher Phones", "Teacher Contact"],
      hint: "10-digit mobiles in the same order as Teacher Names, separated by commas",
    },

    // Functional aspects
    { key: "functionalAspects.infrastructureQuality", label: "Infrastructure Quality", type: "enum", options: INFRA_QUALITY },
    { key: "functionalAspects.teacherAttendance", label: "Teacher Attendance", type: "enum", options: TEACHER_ATTENDANCE },
    { key: "functionalAspects.studentEngagement", label: "Student Engagement", type: "enum", options: ENGAGEMENT },
    { key: "functionalAspects.learningOutcome", label: "Learning Outcome", type: "enum", options: LEARNING_OUTCOME },
    { key: "functionalAspects.communityParticipation", label: "Community Participation", type: "enum", options: COMMUNITY },
  ],
  sampleRow: {
    centreCode: "SC-001",
    centreName: "Vivekananda Study Centre",
    sourceOfFunding: "CSR - Infosys Foundation",
    infrastructure: "Community Hall",
    timing: "4:00 PM - 6:00 PM",
    studentsLevelOfEducation: ["Class 1-5", "Class 6-8"],
    wardNo: "Ward 12",
    habitation: "Kalyani Basti",
    projectResponsible: "Amit Sen",
    dateOfEstablishment: "2023-06-15",
    totalStudents: 25,
    groupLeaderName: "Sujata Roy",
    groupLeaderContact: "9876543210",
    teacherNames: "Anjali Das, Ravi Kumar",
    teacherContacts: "9123456780, 9988776655",
    "functionalAspects.infrastructureQuality": "Good",
    "functionalAspects.teacherAttendance": "Regular",
    "functionalAspects.studentEngagement": "High",
    "functionalAspects.learningOutcome": "Satisfactory",
    "functionalAspects.communityParticipation": "Moderate",
  },
  transform: (payload) => {
    if (payload.teacherNames !== undefined) payload.teacherNames = splitList(payload.teacherNames);
    if (payload.teacherContacts !== undefined) {
      payload.teacherContacts = splitList(payload.teacherContacts).map((c) => c.replace(/\D/g, "").slice(-10));
    }
    return payload;
  },
};
