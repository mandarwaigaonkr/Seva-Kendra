// Excel import template — Education › Competitive Exams
// Source of truth: sevaKendra-backend/src/modules/education/models/competitiveExam.model.js
// Verify with: node scripts/verify-import-templates.mjs competitiveExam

export const EXAM_GENDER = ["Male", "Female", "Other"];
export const CATEGORY = ["SC", "ST", "OBC", "Muslim", "General", "Other"];
export const SOCIAL_STATUS = ["SC", "ST", "OBC", "General", "EWS"];
export const EXAM_TYPES = [
  "JEE Main",
  "JEE Advanced",
  "NEET",
  "UPSC",
  "SSC",
  "Bank PO",
  "Bank Clerk",
  "Railway",
  "Police",
  "Teaching",
  "State PSC",
  "Other",
];
export const EXAM_STATUS = ["Preparing", "Appeared", "Qualified", "Not Qualified", "Discontinued"];
export const EXAM_RESULT = ["Pending", "Qualified", "Not Qualified", "Appeared", "Not Appeared"];

export default {
  title: "Competitive Exam Records",
  model: "education/models/competitiveExam.model.js",
  uniqueKeys: ["householdCode"],
  // scStudentId is an optional ObjectId link to an SC Student, chosen from a list in the form;
  // a spreadsheet can't carry it, so imported records are simply not linked.
  // Monthly progress notes are captured on the tracking screens, not imported.
  excluded: ["scStudentId", "progressReporting"],
  fields: [
    // Basic information
    {
      key: "householdCode",
      label: "Household Code",
      type: "text",
      required: true,
      unique: true,
      headerAliases: ["ID Code", "Beneficiary ID"],
      hint: "Must be unique per candidate, e.g. CE-HH-301. Imported rows are not linked to an SC Student record.",
    },
    { key: "name", label: "Name", type: "text", required: true, headerAliases: ["Candidate Name"] },
    {
      key: "gender",
      label: "Gender",
      type: "enum",
      required: true,
      options: EXAM_GENDER,
      aliases: { Male: ["M", "Boy"], Female: ["F", "Girl"] },
    },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    {
      key: "category",
      label: "Category",
      type: "enum",
      options: CATEGORY,
      headerAliases: ["Social Category", "Caste Category"],
      hint: "EWS is not a category — put it in Social Status",
    },
    {
      key: "socialStatus",
      label: "Social Status",
      type: "enum",
      options: SOCIAL_STATUS,
      aliases: { EWS: ["Economically Weaker Section"] },
      hint: "Muslim / Other are categories, not social statuses",
    },
    {
      key: "educationalStatus",
      label: "Educational Status",
      type: "text",
      required: true,
      headerAliases: ["Education", "Highest Qualification"],
      hint: "e.g. Class 12 passed, B.Sc 2nd year",
    },

    // Exam details
    {
      key: "typeOfExam",
      label: "Type of Exam",
      type: "multiEnum",
      required: true,
      options: EXAM_TYPES,
      aliases: {
        "JEE Main": ["JEE Mains", "JEE"],
        "Bank PO": ["IBPS PO", "SBI PO"],
        "Bank Clerk": ["IBPS Clerk", "SBI Clerk"],
        Railway: ["RRB", "Railways", "RRB NTPC"],
        "State PSC": ["WBCS", "PSC", "State Public Service Commission"],
        Teaching: ["TET", "CTET", "B.Ed Entrance"],
        SSC: ["SSC CGL", "SSC CHSL", "SSC GD"],
      },
      headerAliases: ["Exam Type", "Exam"],
      hint: "One or more, separated by commas, e.g. JEE Main, NEET",
    },
    {
      key: "status",
      label: "Status",
      type: "enum",
      options: EXAM_STATUS,
      aliases: { Discontinued: ["Dropped", "Dropped Out"] },
      hint: "Defaults to Preparing when blank",
    },

    // Enrollment
    {
      key: "dateOfEnrollment",
      label: "Date of Enrollment",
      type: "date",
      required: true,
      headerAliases: ["Date of Enrolment", "Enrollment Date", "Date of Reporting"],
    },
    { key: "enrolledBy", label: "Enrolled By", type: "text", required: true, headerAliases: ["Reported By"] },

    // Assessment
    { key: "dateOfEducationalAssessment", label: "Date of Educational Assessment", type: "date" },
    { key: "educationalScreeningResults", label: "Educational Screening Results", type: "text" },
    { key: "dateOfCareerCounselling", label: "Date of Career Counselling", type: "date" },
    { key: "counselingReport", label: "Counselling Report", type: "text", headerAliases: ["Counseling Report", "Remarks"] },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },

    // Examination
    { key: "applicationDate", label: "Application Date", type: "date" },
    { key: "examDate", label: "Exam Date", type: "date" },
    {
      key: "result",
      label: "Result",
      type: "enum",
      options: EXAM_RESULT,
      aliases: { Qualified: ["Pass", "Passed", "Cleared"], "Not Qualified": ["Fail", "Failed", "Not Cleared"] },
      hint: "Defaults to Pending when blank",
    },
  ],
  sampleRow: {
    householdCode: "CE-HH-301",
    name: "Amit Ghosh",
    gender: "Male",
    age: 19,
    contactNo: "9876543210",
    headOfHousehold: "Tapan Ghosh",
    wardNo: "Ward 11",
    habitation: "Salt Lake",
    projectResponsible: "Sneha Roy",
    category: "SC",
    socialStatus: "SC",
    educationalStatus: "Class 12 passed (Science)",
    typeOfExam: ["JEE Main", "NEET"],
    status: "Preparing",
    dateOfEnrollment: "2024-02-01",
    enrolledBy: "Coordinator Subhash",
    dateOfEducationalAssessment: "2024-02-05",
    educationalScreeningResults: "Strong in Physics, needs work in Chemistry",
    dateOfCareerCounselling: "2024-02-12",
    counselingReport: "Enrolled in weekend coaching batch at Apex Academy",
    individualCarePlan: "Weekly mock tests and doubt-clearing sessions",
    applicationDate: "2024-03-10",
    examDate: "2024-04-06",
    result: "Pending",
  },
};
