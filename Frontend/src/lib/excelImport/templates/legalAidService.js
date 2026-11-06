// Excel import template — Social Justice › Legal Aid
// Source of truth: sevaKendra-backend/src/modules/socialJustice/models/legalAidService.model.js
// Verify with: node scripts/verify-import-templates.mjs legalAidService

export const LEGAL_AID_GENDER = ["Male", "Female", "Other"];
export const LEGAL_AID_ISSUES = [
  "Property Dispute",
  "Family Dispute",
  "Domestic Violence",
  "Labor Rights",
  "Consumer Rights",
  "Land Rights",
  "Government Benefits",
  "Legal Documentation",
  "Criminal Case",
  "Civil Case",
  "Other",
];
export const LEGAL_AID_STATUS = ["Pending", "In Progress", "Resolved", "Closed", "Referred"];
export const LEGAL_AID_PRIORITY = ["Low", "Medium", "High", "Urgent"];

export default {
  title: "Legal Aid Cases",
  model: "socialJustice/models/legalAidService.model.js",
  uniqueKeys: ["uniqueId"],
  excluded: [
    // Monthly progress is captured through the tracking screens, not the import.
    "progressReporting",
    // Array of uploaded photo sub-documents — attached from the record screen.
    "photoDocumentation",
  ],
  fields: [
    // Basic information
    { key: "householdCode", label: "Household Code", type: "text", required: true },
    {
      key: "uniqueId",
      label: "Unique ID",
      type: "text",
      required: true,
      unique: true,
      hint: "Must be unique, e.g. LA-001",
      headerAliases: ["Case ID"],
    },
    { key: "name", label: "Name", type: "text", required: true, headerAliases: ["Client Name"] },
    { key: "gender", label: "Gender", type: "enum", required: true, options: LEGAL_AID_GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true, headerAliases: ["Registration Date"] },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },

    // Case
    {
      key: "natureOfIssue",
      label: "Nature of Issue",
      type: "enum",
      required: true,
      options: LEGAL_AID_ISSUES,
      headerAliases: ["Case Type"],
      aliases: {
        "Labor Rights": ["Labour Rights", "Labour", "Labor"],
        "Domestic Violence": ["DV"],
        "Government Benefits": ["Govt Benefits", "Government Scheme"],
        "Legal Documentation": ["Documentation", "Documents"],
      },
    },
    {
      key: "status",
      label: "Case Status",
      type: "enum",
      options: LEGAL_AID_STATUS,
      headerAliases: ["Status"],
      hint: "Defaults to Pending when blank",
      aliases: { "In Progress": ["Ongoing"], Referred: ["Referral"] },
    },
    {
      key: "priority",
      label: "Priority",
      type: "enum",
      options: LEGAL_AID_PRIORITY,
      hint: "Defaults to Medium when blank",
      aliases: { Urgent: ["Critical"] },
    },
    { key: "actionPlan", label: "Action Plan", type: "text", required: true },

    // Follow-up
    { key: "remarks", label: "Remarks", type: "text" },
    {
      key: "followUpRequired",
      label: "Follow-up Required",
      type: "boolean",
      hint: "Yes / No — when Yes and no follow-up date is given, the date is set 7 days ahead",
    },
    { key: "followUpDate", label: "Follow-up Date", type: "date", headerAliases: ["Next Hearing"] },
  ],
  sampleRow: {
    householdCode: "HH-0412",
    uniqueId: "LA-001",
    name: "Ravi Kumar",
    gender: "Male",
    age: 36,
    contactNo: "9876543210",
    headOfHousehold: "Ravi Kumar",
    wardNo: "Ward 5",
    habitation: "North Colony",
    projectResponsible: "Case Worker B",
    dateOfReporting: "2024-02-01",
    reportedBy: "Field Worker E",
    natureOfIssue: "Property Dispute",
    status: "In Progress",
    priority: "High",
    actionPlan: "Collect patta documents, refer to DLSA panel lawyer, draft legal notice",
    remarks: "Dispute with neighbour over boundary wall",
    followUpRequired: true,
    followUpDate: "2024-02-15",
  },
};
