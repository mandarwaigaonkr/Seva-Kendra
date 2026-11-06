// Excel import template — Education › Dropouts
// Source of truth: sevaKendra-backend/src/modules/education/models/dropout.model.js
// Verify with: node scripts/verify-import-templates.mjs dropout

export const DROPOUT_GENDER = ["Boy", "Girl", "Other"];
export const CATEGORY = ["SC", "ST", "OBC", "Muslim", "General", "Other"];
export const ENROLLMENT_STATUS = ["Pending", "Enrolled", "Not Enrolled", "In Progress"];

const YES_NO_HINT = "Yes / No";

export default {
  title: "Dropouts",
  model: "education/models/dropout.model.js",
  uniqueKeys: ["householdCode"],
  // Monthly progress notes and photo URLs are captured on the tracking screens, not imported.
  excluded: ["progressReporting", "photoDocumentation"],
  fields: [
    // Basic information
    {
      key: "householdCode",
      label: "Household Code",
      type: "text",
      required: true,
      unique: true,
      headerAliases: ["ID Code", "Beneficiary ID"],
      hint: "Must be unique per dropout record, e.g. DO-HH-201",
    },
    { key: "name", label: "Name", type: "text", required: true, headerAliases: ["Student Name"] },
    {
      key: "gender",
      label: "Gender",
      type: "enum",
      required: true,
      options: DROPOUT_GENDER,
      aliases: { Boy: ["Male", "M", "B"], Girl: ["Female", "F", "G"] },
    },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "category", label: "Category", type: "enum", options: CATEGORY, headerAliases: ["Social Category", "Caste Category"] },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Dropout details
    { key: "yearOfDropout", label: "Year of Dropout", type: "integer", required: true, min: 1990, max: 2100, hint: "Four-digit year, e.g. 2023" },
    {
      key: "educationLevelWhenDropout",
      label: "Education Level When Dropout",
      type: "text",
      required: true,
      headerAliases: ["Last Class Completed", "Class at Dropout"],
      hint: "e.g. Class 7",
    },
    {
      key: "schoolNameWhenDropout",
      label: "School Name When Dropout",
      type: "text",
      required: true,
      headerAliases: ["Last School Attended", "School at Dropout"],
    },
    { key: "reasonForDropout", label: "Reason for Dropout", type: "text", required: true, headerAliases: ["Reason"] },
    {
      key: "schoolName",
      label: "Current School Name",
      type: "text",
      headerAliases: ["School Name"],
      hint: "Leave blank to use School Name When Dropout (same as the form)",
    },
    { key: "enrolmentDate", label: "Enrolment Date", type: "date", headerAliases: ["Enrollment Date"] },
    { key: "schoolNameAtEnrolment", label: "School Name at Enrolment", type: "text", headerAliases: ["School Name at Enrollment"] },

    // Documents
    { key: "documentsCheck.birthCertificate", label: "Birth Certificate Available", type: "boolean", headerAliases: ["Birth Certificate"], hint: YES_NO_HINT },
    { key: "documentsCheck.polioCard", label: "Polio Card Available", type: "boolean", headerAliases: ["Polio Card"], hint: YES_NO_HINT },
    { key: "documentsCheck.adharCard", label: "Aadhaar Card Available", type: "boolean", headerAliases: ["Aadhaar Card", "Adhar Card", "Aadhar Card"], hint: YES_NO_HINT },
    { key: "documentsCheck.transferCertificate", label: "Transfer Certificate Available", type: "boolean", headerAliases: ["Transfer Certificate", "TC"], hint: YES_NO_HINT },

    // Assessment
    { key: "dateOfEducationalAssessment", label: "Date of Educational Assessment", type: "date" },
    { key: "educationalScreeningResults", label: "Educational Screening Results", type: "text" },
    { key: "dateOfCareerCounselling", label: "Date of Career Counselling", type: "date" },
    { key: "counselingReport", label: "Counselling Report", type: "text", headerAliases: ["Counseling Report", "Remarks"] },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },

    // Re-admission
    {
      key: "enrollmentStatus",
      label: "Enrollment Status",
      type: "enum",
      options: ENROLLMENT_STATUS,
      aliases: { Enrolled: ["Re-enrolled", "Readmitted", "Re-admitted"], "In Progress": ["Ongoing"], "Not Enrolled": ["Not Re-enrolled"] },
      headerAliases: ["Enrolment Status", "Re-enrollment Status"],
      hint: "Defaults to Pending when blank",
    },
    { key: "dateOfReAdmission", label: "Date of Re-admission", type: "date", headerAliases: ["Date of Readmission"] },
    { key: "educationLevelWhenReAdmission", label: "Education Level at Re-admission", type: "text", headerAliases: ["Education Level When Re-admission"] },
    { key: "schoolNameWhenReAdmission", label: "School Name at Re-admission", type: "text", headerAliases: ["School Name When Re-admission"] },
  ],
  sampleRow: {
    householdCode: "DO-HH-201",
    name: "Sunil Kumar",
    gender: "Boy",
    age: 15,
    contactNo: "9876543210",
    headOfHousehold: "Mohan Kumar",
    wardNo: "Ward 16",
    habitation: "Kazi Para",
    projectResponsible: "Ravi Shankar",
    category: "SC",
    dateOfReporting: "2024-01-20",
    reportedBy: "Volunteer Suman",
    yearOfDropout: 2023,
    educationLevelWhenDropout: "Class 7",
    schoolNameWhenDropout: "City Model School",
    reasonForDropout: "Financial difficulty; started working at a tea stall",
    schoolName: "Kazi Para Free Primary School",
    enrolmentDate: "2018-06-01",
    schoolNameAtEnrolment: "City Model School",
    documentsCheck: {
      birthCertificate: true,
      polioCard: false,
      adharCard: true,
      transferCertificate: false,
    },
    dateOfEducationalAssessment: "2024-02-02",
    educationalScreeningResults: "Reads at Class 5 level",
    dateOfCareerCounselling: "2024-02-10",
    counselingReport: "Parents agreed to re-admission after counselling",
    individualCarePlan: "Bridge course for 3 months, then re-admission",
    enrollmentStatus: "In Progress",
    dateOfReAdmission: "2024-06-03",
    educationLevelWhenReAdmission: "Class 8",
    schoolNameWhenReAdmission: "Kazi Para Free Primary School",
  },
  transform(payload) {
    // The form saves schoolName = schoolNameWhenDropout; keep imports consistent.
    if (!payload.schoolName && payload.schoolNameWhenDropout) {
      payload.schoolName = payload.schoolNameWhenDropout;
    }
    return payload;
  },
};
