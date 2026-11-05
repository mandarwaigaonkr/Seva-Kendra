// Excel import template — Social Justice › CBU/CBO Details
// Source of truth: sevaKendra-backend/src/modules/socialJustice/models/cbucboDetails.model.js
// Verify with: node scripts/verify-import-templates.mjs cbucboDetails

export const CBUCBO_GROUP_TYPES = ["CBUCBO", "SHG", "Youth Group", "Women Group", "Farmer Producer Group", "Other"];

const todayYMD = () => new Date().toISOString().slice(0, 10);

export default {
  title: "CBU/CBO Groups",
  model: "socialJustice/models/cbucboDetails.model.js",
  uniqueKeys: ["groupId"],
  excluded: [
    // Monthly progress is captured through the tracking screens, not the import.
    "progressReporting",
    // Before / intermediate / after photo links are attached from the record screen, not typed into a sheet.
    "photoDocumentation",
  ],
  fields: [
    // Basic information
    { key: "groupId", label: "Group ID", type: "text", required: true, unique: true, hint: "Must be unique, e.g. CBO-001" },
    { key: "groupName", label: "Group Name", type: "text", required: true },
    { key: "functionalArea", label: "Functional Area", type: "text", required: true, hint: "e.g. Livelihoods, Community Support" },
    {
      key: "groupType",
      label: "Group Type",
      type: "enum",
      required: true,
      options: CBUCBO_GROUP_TYPES,
      aliases: {
        CBUCBO: ["CBU", "CBO", "CBU/CBO", "CBU-CBO"],
        SHG: ["Self Help Group", "Self-Help Group"],
        "Farmer Producer Group": ["Farmer Group", "FPG", "FPO"],
        "Women Group": ["Womens Group", "Women's Group", "Mahila Mandal"],
        "Youth Group": ["Youth Club"],
      },
    },
    { key: "wardNo", label: "Ward Number", type: "ward", required: true, headerAliases: ["Ward No", "Ward"] },
    { key: "habitation", label: "Habitation", type: "text", required: true },
    { key: "projectResponsible", label: "Project Responsible", type: "text", required: true },
    { key: "dateOfFormation", label: "Date of Formation", type: "date", required: true, hint: "Cannot be in the future" },
    { key: "totalMembers", label: "Total Members", type: "integer", required: true, min: 1 },

    // Leadership
    { key: "groupLeader", label: "Group Leader", type: "text", required: true },
    { key: "contactNo", label: "Contact Number", type: "phone", headerAliases: ["Contact No", "Mobile", "Phone"] },
    { key: "groupMentor", label: "Group Mentor", type: "text" },

    // Capacity building & action planning
    {
      key: "listOfCapacityBuildingTrainings",
      label: "List of Capacity Building Trainings",
      type: "text",
      headerAliases: ["Capacity Building Trainings"],
    },
    { key: "trainingOutcomes", label: "Training Outcomes", type: "text" },
    { key: "actionPlanForGroup", label: "Action Plan for Group", type: "text", headerAliases: ["Action Plan"] },
    { key: "majorAchievements", label: "Major Achievements", type: "text" },
    { key: "remarks", label: "Remarks", type: "text" },
  ],
  // The model's pre("save") hook rejects a formation date in the future — flag it in the preview instead.
  transform(payload) {
    if (payload.dateOfFormation && payload.dateOfFormation > todayYMD()) {
      throw new Error("Date of Formation cannot be in the future");
    }
    return payload;
  },
  sampleRow: {
    groupId: "CBO-001",
    groupName: "Ward 12 Mahila Shakti Group",
    functionalArea: "Livelihoods and savings",
    groupType: "Women Group",
    wardNo: "Ward 12",
    habitation: "Kallar Street",
    projectResponsible: "Project Officer A",
    dateOfFormation: "2023-06-15",
    totalMembers: 25,
    groupLeader: "Anita Devi",
    contactNo: "9876543210",
    groupMentor: "Meena Kumari",
    listOfCapacityBuildingTrainings: "Leadership, bookkeeping, savings and credit",
    trainingOutcomes: "Members maintain their own savings ledger",
    actionPlanForGroup: "Monthly savings review; open group bank account by March",
    majorAchievements: "Linked to NRLM revolving fund",
    remarks: "Meets every 2nd Saturday",
  },
};
