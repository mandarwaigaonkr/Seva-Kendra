// Excel import template — Education › SC Students
// Source of truth: sevaKendra-backend/src/modules/education/models/scStudent.model.js
// Verify with: node scripts/verify-import-templates.mjs scStudent

export const SC_GENDER = ["Boy", "Girl", "Other"];
export const CLASS_GRADES = [
  "Pre-Primary",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];
export const STUDENT_STATUS = ["Dropout", "School-Going", "Study Centre Attendee"];
export const CATEGORY = ["SC", "ST", "OBC", "Muslim", "General", "Other"];

const ordinal = (n) => {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
};

// "8", "8th", "8th Standard", "Std 8", "Grade 8", "Class VIII"… → "Class 8"
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const CLASS_ALIASES = {
  "Pre-Primary": ["Pre Primary", "Nursery", "LKG", "UKG", "KG", "Kindergarten"],
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => {
      const n = i + 1;
      return [
        `Class ${n}`,
        [
          String(n),
          ordinal(n),
          `${ordinal(n)} Standard`,
          `${ordinal(n)} Std`,
          `${ordinal(n)} Class`,
          `Std ${n}`,
          `Standard ${n}`,
          `Grade ${n}`,
          `Class ${ROMAN[n]}`,
        ],
      ];
    })
  ),
};

export default {
  title: "SC Students",
  model: "education/models/scStudent.model.js",
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
      headerAliases: ["Beneficiary ID", "ID Code"],
      hint: "Must be unique per student, e.g. SC-HH-101",
    },
    { key: "name", label: "Name", type: "text", required: true, headerAliases: ["Student Name"] },
    {
      key: "gender",
      label: "Gender",
      type: "enum",
      options: SC_GENDER,
      aliases: { Boy: ["Male", "M", "B"], Girl: ["Female", "F", "G"] },
    },
    { key: "dateOfBirth", label: "Date of Birth", type: "date", headerAliases: ["DOB"] },
    {
      key: "age",
      label: "Age",
      type: "integer",
      min: 0,
      max: 120,
      hint: "Leave blank to calculate it from Date of Birth",
    },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text" },
    { key: "fatherName", label: "Father Name", type: "text", headerAliases: ["Father's Name"] },
    { key: "motherName", label: "Mother Name", type: "text", headerAliases: ["Mother's Name"] },
    { key: "fatherOccupation", label: "Father Occupation", type: "text", headerAliases: ["Father's Occupation"] },
    { key: "motherOccupation", label: "Mother Occupation", type: "text", headerAliases: ["Mother's Occupation"] },

    // Schooling
    {
      key: "classGrade",
      label: "Class / Grade",
      type: "enum",
      options: CLASS_GRADES,
      aliases: CLASS_ALIASES,
      headerAliases: ["Class", "Grade", "Class/Grade"],
    },
    {
      key: "studentStatus",
      label: "Student Status",
      type: "enum",
      options: STUDENT_STATUS,
      aliases: {
        Dropout: ["Dropped Out", "Drop Out", "Drop-out"],
        "School-Going": ["School Going", "Enrolled", "Attending", "In School"],
        "Study Centre Attendee": ["Study Center Attendee", "Study Centre", "Study Center"],
      },
      headerAliases: ["Status"],
    },
    { key: "schoolName", label: "School Name", type: "text" },

    // Location
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text" },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "category", label: "Category", type: "enum", options: CATEGORY, headerAliases: ["Social Category", "Caste Category"] },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date" },
    { key: "reportedBy", label: "Reported By", type: "text" },
    { key: "natureOfIssue", label: "Nature of Issue", type: "text", headerAliases: ["Remarks"] },

    // Assessment
    { key: "dateOfEducationalAssessment", label: "Date of Educational Assessment", type: "date" },
    { key: "educationalScreeningResults", label: "Educational Screening Results", type: "text" },
    { key: "dateOfCareerCounselling", label: "Date of Career Counselling", type: "date" },
    { key: "counselingReport", label: "Counselling Report", type: "text", headerAliases: ["Counseling Report"] },
    { key: "individualCarePlan", label: "Individual Care Plan", type: "text" },
  ],
  sampleRow: {
    householdCode: "SC-HH-101",
    name: "Rahul Das",
    gender: "Boy",
    dateOfBirth: "2010-06-12",
    age: 14,
    contactNo: "9876543210",
    headOfHousehold: "Ramesh Das",
    fatherName: "Ramesh Das",
    motherName: "Sunita Das",
    fatherOccupation: "Rickshaw puller",
    motherOccupation: "Domestic worker",
    classGrade: "Class 8",
    studentStatus: "School-Going",
    schoolName: "Kolkata Municipal High School",
    wardNo: "Ward 14",
    habitation: "Subhash Nagar",
    projectResponsible: "Priya Sharma",
    category: "SC",
    dateOfReporting: "2024-02-15",
    reportedBy: "Teacher Anita",
    natureOfIssue: "Irregular attendance due to family work",
    dateOfEducationalAssessment: "2024-02-20",
    educationalScreeningResults: "Below grade level in Maths",
    dateOfCareerCounselling: "2024-03-05",
    counselingReport: "Interested in science; parents supportive",
    individualCarePlan: "Twice-weekly Maths tutoring at study centre",
  },
};
