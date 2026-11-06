// Excel import template — Social Justice › Workshops & Awareness
// Source of truth: sevaKendra-backend/src/modules/socialJustice/models/workshopsAwareness.model.js
// Verify with: node scripts/verify-import-templates.mjs workshopsAwareness

export const WORKSHOP_GROUP_TYPES = [
  "CBUCBO",
  "SHG",
  "Youth Group",
  "Women Group",
  "Community Group",
  "Farmer Group",
  "Student Group",
  "Other",
];

export default {
  title: "Workshops & Awareness",
  model: "socialJustice/models/workshopsAwareness.model.js",
  uniqueKeys: [],
  fields: [
    // Group details
    {
      key: "groupId",
      label: "Group ID",
      type: "text",
      required: true,
      hint: "ID of the group that attended, e.g. CBO-001 (a group can attend many workshops)",
    },
    { key: "groupName", label: "Group Name", type: "text", required: true },
    {
      key: "groupType",
      label: "Group Type",
      type: "enum",
      required: true,
      options: WORKSHOP_GROUP_TYPES,
      aliases: {
        CBUCBO: ["CBU", "CBO", "CBU/CBO", "CBU-CBO"],
        SHG: ["Self Help Group", "Self-Help Group"],
        "Farmer Group": ["Farmer Producer Group", "FPG", "FPO"],
        "Women Group": ["Womens Group", "Women's Group", "Mahila Mandal"],
        "Youth Group": ["Youth Club"],
        "Student Group": ["Students", "School Group"],
      },
    },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },

    // Training details
    { key: "topic", label: "Topic", type: "text", required: true, headerAliases: ["Training Topic"] },
    { key: "dateOfTraining", label: "Date of Training", type: "date", required: true, headerAliases: ["Training Date"] },
    { key: "resourcePerson", label: "Resource Person", type: "text", required: true },
    { key: "profileOfResourcePerson", label: "Profile of Resource Person", type: "text", required: true },
    { key: "agenda", label: "Agenda", type: "text", required: true },
    { key: "totalParticipants", label: "Total Participants", type: "integer", required: true, min: 1, headerAliases: ["Participants"] },
    { key: "outcome", label: "Outcome", type: "text", required: true },
  ],
  sampleRow: {
    groupId: "CBO-001",
    groupName: "Ward 12 Mahila Shakti Group",
    groupType: "Women Group",
    wardNo: "Ward 12",
    habitation: "Kallar Street",
    projectResponsible: "Project Officer A",
    topic: "Know your rights: Domestic Violence Act",
    dateOfTraining: "2024-03-05",
    resourcePerson: "Adv. Kavitha Rao",
    profileOfResourcePerson: "Advocate, District Legal Services Authority panel",
    agenda: "PWDV Act basics, helplines, filing a DIR",
    totalParticipants: 28,
    outcome: "Participants can name 3 helplines and the protection officer",
  },
};
