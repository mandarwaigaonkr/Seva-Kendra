// Excel import template — Health › Health Camps
// Source of truth: sevaKendra-backend/src/modules/health/models/healthCamp.model.js
// Verify with: node scripts/verify-import-templates.mjs healthCamp

const TARGET_GROUP = ["Children", "Women", "Elderly", "General", "Pregnant Women", "Adolescents", "PwD", "Other"];
const CAMP_TYPE = [
  "General Health Checkup",
  "Eye Checkup",
  "Dental Checkup",
  "Maternal Health",
  "Child Health",
  "Vaccination",
  "Mental Health",
  "Nutrition",
  "Chronic Disease",
  "Other",
];
const MEDICINE_TYPE = ["Allopathic", "Ayurvedic", "Homeopathic", "Unani", "Others"];

export default {
  title: "Health Camps",
  model: "health/models/healthCamp.model.js",
  uniqueKeys: [],
  // Monthly follow-ups are captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Group details
    { key: "dateOfCamp", label: "Date of Camp", type: "date", required: true, headerAliases: ["Camp Date"] },
    {
      key: "targetGroup",
      label: "Target Group",
      type: "enum",
      required: true,
      options: TARGET_GROUP,
      aliases: {
        Children: ["Child", "Kids"],
        "Pregnant Women": ["Pregnant", "Pregnant Woman"],
        Adolescents: ["Adolescent"],
        PwD: ["PWD", "Persons with Disability", "Disabled"],
        Elderly: ["Senior Citizens", "Old Age"],
      },
    },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "village", label: "Village", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Camp details
    {
      key: "typeOfHealthCamp",
      label: "Type of Health Camp",
      type: "enum",
      required: true,
      options: CAMP_TYPE,
      aliases: {
        "General Health Checkup": ["General", "General Checkup", "General Health Check-up"],
        "Eye Checkup": ["Eye Camp", "Eye"],
        "Dental Checkup": ["Dental", "Dental Camp"],
        "Maternal Health": ["Maternal"],
        "Child Health": ["Pediatric", "Paediatric"],
        "Chronic Disease": ["NCD", "Chronic Diseases"],
      },
      headerAliases: ["Camp Type"],
    },
    {
      key: "medicineType",
      label: "Medicine Type",
      type: "enum",
      required: true,
      options: MEDICINE_TYPE,
      aliases: {
        Allopathic: ["Allopathy"],
        Ayurvedic: ["Ayurveda"],
        Homeopathic: ["Homeopathy", "Homoeopathy"],
        Others: ["Other", "Combination"],
      },
    },
    { key: "specialisation", label: "Specialisation", type: "text", required: true, headerAliases: ["Specialization"] },
    { key: "organiser", label: "Organiser", type: "text", required: true, headerAliases: ["Organizer"] },
    { key: "numberOfDoctors", label: "Number of Doctors", type: "integer", required: true, min: 0, headerAliases: ["Doctors"] },
    { key: "numberOfGDA", label: "Number of GDA", type: "integer", required: true, min: 0, headerAliases: ["GDA"] },
    {
      key: "totalBeneficiaries",
      label: "Total Beneficiaries",
      type: "integer",
      required: true,
      min: 0,
      headerAliases: ["Beneficiaries"],
    },
    { key: "majorFindings", label: "Major Findings", type: "text", required: true, headerAliases: ["Remarks", "Findings"] },
    { key: "followUpDate", label: "Follow Up Date", type: "date", headerAliases: ["Follow-up Date"] },
  ],
  sampleRow: {
    dateOfCamp: "2024-02-10",
    targetGroup: "Elderly",
    wardNo: "Ward 8",
    habitation: "Barabazar",
    village: "Kolkata Central",
    projectResponsible: "Dr. R. K. Das",
    typeOfHealthCamp: "General Health Checkup",
    medicineType: "Allopathic",
    specialisation: "General Medicine",
    organiser: "Seva Kendra with District Hospital",
    numberOfDoctors: 3,
    numberOfGDA: 4,
    totalBeneficiaries: 75,
    majorFindings: "12 cases of hypertension, 5 referred for cataract surgery",
    followUpDate: "2024-03-10",
  },
};
