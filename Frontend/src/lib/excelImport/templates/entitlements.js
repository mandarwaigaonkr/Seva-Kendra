// Excel import template — Social Justice › Entitlements
// Source of truth: sevaKendra-backend/src/modules/socialJustice/models/entitlements.model.js
// Verify with: node scripts/verify-import-templates.mjs entitlements

export const ENTITLEMENT_GENDER = ["Male", "Female", "Other"];
export const ENTITLEMENT_STATUS = [
  "Applied",
  "Approved",
  "Disbursed",
  "Rejected",
  "Pending",
  "In Progress",
  "Resolved",
  "Under Verification",
  "On Hold",
];
export const ENTITLEMENT_DOCUMENT_TYPES = [
  "Aadhar Card",
  "Voter ID",
  "Passport",
  "Driving License",
  "PAN Card",
  "Ration Card",
  "Birth Certificate",
  "Domicile Certificate",
  "Other",
];

const STATUS_ALIASES = { "In Progress": ["Ongoing"], "Under Verification": ["Verification", "Under Review"], "On Hold": ["Hold"] };

export default {
  title: "Entitlements",
  model: "socialJustice/models/entitlements.model.js",
  uniqueKeys: ["idCode"],
  // Monthly progress is captured through the tracking screens, not the import.
  excluded: ["progressReporting"],
  fields: [
    // Basic information
    { key: "householdCode", label: "Household Code", type: "text" },
    {
      key: "idCode",
      label: "ID Code",
      type: "text",
      unique: true,
      hint: "Must be unique, e.g. ENT-001. Fill it in: the database allows only one record without an ID Code.",
      headerAliases: ["Entitlement ID", "Beneficiary ID"],
    },
    { key: "name", label: "Name", type: "text", required: true, headerAliases: ["Beneficiary Name"] },
    { key: "gender", label: "Gender", type: "enum", required: true, options: ENTITLEMENT_GENDER, aliases: { Male: ["M"], Female: ["F"] } },
    { key: "age", label: "Age", type: "integer", required: true, min: 0, max: 120 },
    { key: "headOfHousehold", label: "Head of Household", type: "text", required: true },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Reporting
    { key: "dateOfReporting", label: "Date of Reporting", type: "date", required: true },
    { key: "reportedBy", label: "Reported By", type: "text", required: true },
    { key: "applicationDate", label: "Application Date", type: "date" },
    {
      key: "status",
      label: "Overall Status",
      type: "enum",
      options: ENTITLEMENT_STATUS,
      aliases: STATUS_ALIASES,
      headerAliases: ["Case Status", "Status"],
      hint: "Defaults to Applied when blank",
    },

    // ID proof & domicile
    {
      key: "idProofAndDomicile.typeOfDocument",
      label: "ID Proof Document Type",
      type: "enum",
      options: ENTITLEMENT_DOCUMENT_TYPES,
      headerAliases: ["Document Type", "Type of Document"],
      aliases: {
        "Aadhar Card": ["Aadhaar", "Aadhaar Card", "Aadhar", "UID"],
        "Voter ID": ["Voter Card", "EPIC", "Voter ID Card"],
        "Driving License": ["Driving Licence", "DL"],
        "PAN Card": ["PAN"],
        "Domicile Certificate": ["Domicile", "Residence Certificate"],
      },
    },
    {
      key: "idProofAndDomicile.natureOfIssue",
      label: "ID Proof Nature of Issue",
      type: "text",
      headerAliases: ["Documentation Nature of Issue"],
    },
    {
      key: "idProofAndDomicile.status",
      label: "ID Proof Status",
      type: "enum",
      options: ENTITLEMENT_STATUS,
      aliases: STATUS_ALIASES,
      headerAliases: ["Documentation Status"],
      hint: "Defaults to Pending when blank",
    },
    { key: "idProofAndDomicile.dateOfReporting", label: "ID Proof Date of Reporting", type: "date" },

    // Schemes
    {
      key: "schemes.eligibleSchemes",
      label: "Eligible Schemes",
      type: "text",
      headerAliases: ["Entitlement Type", "Scheme"],
      hint: "e.g. Old Age Pension, Ration Card, Housing Scheme",
    },
    { key: "schemes.natureOfIssue", label: "Scheme Nature of Issue", type: "text", headerAliases: ["Government Scheme Issue"] },
    {
      key: "schemes.status",
      label: "Scheme Status",
      type: "enum",
      options: ENTITLEMENT_STATUS,
      aliases: STATUS_ALIASES,
      hint: "Defaults to Pending when blank",
    },

    // Documents held (Yes / No)
    { key: "documentation.aadhaar", label: "Has Aadhaar", type: "boolean" },
    { key: "documentation.voterId", label: "Has Voter ID", type: "boolean" },
    { key: "documentation.rationCard", label: "Has Ration Card", type: "boolean" },
    { key: "documentation.birthCertificate", label: "Has Birth Certificate", type: "boolean" },
    { key: "documentation.casteCertificate", label: "Has Caste Certificate", type: "boolean" },
    { key: "documentation.incomeCertificate", label: "Has Income Certificate", type: "boolean" },
    { key: "documentation.other", label: "Other Documents", type: "text" },

    // Government schemes availed (Yes / No)
    { key: "governmentSchemes.oldAgePension", label: "Old Age Pension", type: "boolean" },
    { key: "governmentSchemes.widowPension", label: "Widow Pension", type: "boolean" },
    { key: "governmentSchemes.disabilityPension", label: "Disability Pension", type: "boolean" },
    { key: "governmentSchemes.healthScheme", label: "Health Scheme", type: "boolean" },
    { key: "governmentSchemes.pdsFoodSecurity", label: "PDS / Food Security", type: "boolean" },
    { key: "governmentSchemes.housingScheme", label: "Housing Scheme", type: "boolean" },
    { key: "governmentSchemes.other", label: "Other Government Schemes", type: "text" },

    // Follow-up
    { key: "remarks", label: "Remarks", type: "text" },
    {
      key: "followUpRequired",
      label: "Follow-up Required",
      type: "boolean",
      hint: "Yes / No — when Yes and no follow-up date is given, the date is set 7 days ahead",
    },
    { key: "followUpDate", label: "Follow-up Date", type: "date" },
  ],
  sampleRow: {
    householdCode: "HH-0412",
    idCode: "ENT-001",
    name: "Lakshmi Bai",
    gender: "Female",
    age: 64,
    headOfHousehold: "Lakshmi Bai",
    contactNo: "9876543210",
    wardNo: "Ward 8",
    habitation: "East Street",
    projectResponsible: "Field Staff C",
    dateOfReporting: "2024-01-20",
    reportedBy: "Volunteer D",
    applicationDate: "2024-01-22",
    status: "Under Verification",
    "idProofAndDomicile.typeOfDocument": "Aadhar Card",
    "idProofAndDomicile.natureOfIssue": "Name spelling mismatch with ration card",
    "idProofAndDomicile.status": "In Progress",
    "idProofAndDomicile.dateOfReporting": "2024-01-20",
    "schemes.eligibleSchemes": "Old Age Pension",
    "schemes.natureOfIssue": "Application pending at taluk office",
    "schemes.status": "Applied",
    "documentation.aadhaar": true,
    "documentation.voterId": true,
    "documentation.rationCard": true,
    "documentation.birthCertificate": false,
    "documentation.casteCertificate": true,
    "documentation.incomeCertificate": false,
    "documentation.other": "Bank passbook",
    "governmentSchemes.oldAgePension": false,
    "governmentSchemes.widowPension": true,
    "governmentSchemes.disabilityPension": false,
    "governmentSchemes.healthScheme": true,
    "governmentSchemes.pdsFoodSecurity": true,
    "governmentSchemes.housingScheme": false,
    "governmentSchemes.other": "PM-JAY card",
    remarks: "Needs help visiting the taluk office",
    followUpRequired: true,
    followUpDate: "2024-02-05",
  },
};
