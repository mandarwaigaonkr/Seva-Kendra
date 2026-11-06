import autoTrackingService from "../modules/tracking/autoTracking.service.js";
import trackingService from "../modules/tracking/tracking.service.js";

/**
 * Middleware to automatically create monthly follow-up tracking
 * Use this after successful record creation
 */
export const createAutoFollowUp = (recordType) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;

    // Flag to prevent duplicate creation
    let followUpCreated = false;

    // Override the send function
    res.send = async function (data) {
      // Parse the response data
      let responseData;
      try {
        responseData = typeof data === "string" ? JSON.parse(data) : data;
      } catch (error) {
        responseData = data;
      }

      // Check if response was successful and contains created record
      // Only create once per request
      if (
        !followUpCreated &&
        responseData &&
        responseData.success &&
        responseData.data &&
        responseData.data._id
      ) {
        followUpCreated = true; // Set flag immediately to prevent duplicate calls

        const record = responseData.data;
        const userId = req.user?._id || req.user?.id;

        if (userId) {
          // Determine record name based on record type
          let recordName = getRecordName(record, recordType);
          let module = autoTrackingService.getModuleFromRecordType(recordType);

          // Create auto follow-up (don't await to avoid delaying response)
          autoTrackingService
            .createAutoFollowUp({
              recordType,
              recordId: record._id,
              recordName,
              module,
              createdBy: userId,
              additionalData: {
                wardNo: record.wardNo,
                habitation: record.habitation,
                projectResponsible: record.projectResponsible,
                tags: record.tags,
              },
            })
            .catch((error) => {
              console.error(
                "Background auto follow-up creation failed:",
                error
              );
            });
        }
      }

      // Call the original send function
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Helper function to extract record name based on record type
 */
function getRecordName(record, recordType) {
  switch (recordType) {
    case "Adolescents":
      return (
        record.name || `Adolescent (${record.householdCode || record._id})`
      );
    case "Elderly":
      return record.name || `Elderly (${record.householdCode || record._id})`;
    case "MotherChild":
      return (
        record.nameOfMother || `Mother (${record.householdCode || record._id})`
      );
    case "PWD":
      return record.name || `PWD (${record.householdCode || record._id})`;
    case "Tuberculosis":
      return record.name || `TB Patient (${record.nikshaiId || record._id})`;
    case "HIV":
      return (
        record.name || `HIV Patient (${record.householdCode || record._id})`
      );
    case "Leprosy":
      return (
        record.name || `Leprosy Patient (${record.householdCode || record._id})`
      );
    case "Addiction":
      return record.name || `Addiction Case (${record.caseId || record._id})`;
    case "HealthCamps":
      // Health camps don't have names, use date and target group
      const campDate = record.dateOfCamp
        ? new Date(record.dateOfCamp).toLocaleDateString()
        : "Date TBD";
      const targetGroup = record.targetGroup || "General";
      return `${targetGroup} Health Camp - ${campDate}`;
    case "BoardPreparation":
      return (
        record.name || `Board Student (${record.householdCode || record._id})`
      );
    case "CompetitiveExams":
      return (
        record.name ||
        `Competitive Exam (${record.householdCode || record._id})`
      );
    case "Dropouts":
      return (
        record.name || `Dropout Student (${record.householdCode || record._id})`
      );
    case "Schools":
      return record.schoolName || `School (${record.schoolCode || record._id})`;
    case "SCStudents":
      return (
        record.name || `SC Student (${record.householdCode || record._id})`
      );
    case "StudyCenters":
      return (
        record.centreName || `Study Center (${record.centreCode || record._id})`
      );
    case "CBUCBODetails":
      return record.groupName || `CB/CBO (${record.groupId || record._id})`;
    case "Entitlements":
      return (
        record.name || `Entitlement (${record.householdCode || record._id})`
      );
    case "LegalAid":
      return record.name || `Legal Aid (${record.caseId || record._id})`;
    case "Workshops":
      // Workshops use groupName and topic
      const groupName = record.groupName || "Group";
      const topic = record.topic || "Workshop";
      return `${groupName} - ${topic}`;
    case "OtherDiseases":
      return record.name || `Patient (${record.householdCode || record._id})`;
    default:
      return record.name || `${recordType} Record`;
  }
}

/**
 * Closes a record's open follow-ups once the record itself is deleted (DELETE /:id
 * answered 2xx), so the follow-up list never shows people whose record is gone.
 */
export const closeFollowUpsOnDelete = (recordType) => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300 || req.route?.path !== "/:id") return;
    trackingService.deactivateForRecord(recordType, req.params.id).catch((error) => {
      console.error(`Could not close follow-ups for deleted ${recordType}:`, error.message);
    });
  });
  next();
};
