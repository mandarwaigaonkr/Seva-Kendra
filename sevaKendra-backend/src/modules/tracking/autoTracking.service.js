import trackingService from "./tracking.service.js";
import { MODULE_FOR_RECORD_TYPE, MONTHLY_CATEGORY, nextMonthlyDueDate } from "./tracking.access.js";

/**
 * Automatically create monthly follow-up tracking for a record
 * This should be called after creating any record in the system
 */
class AutoTrackingService {
  /**
   * Create automatic monthly follow-up for a record
   * @param {Object} params - Parameters for auto-tracking
   * @param {String} params.recordType - Type of record (Adolescents, Elderly, etc.)
   * @param {String} params.recordId - MongoDB ObjectId of the record
   * @param {String} params.recordName - Display name of the record
   * @param {String} params.module - Module (Health, Education, Social Justice)
   * @param {String} params.createdBy - User ID who created the record
   * @param {Object} params.additionalData - Additional tracking data (wardNo, habitation, etc.)
   */
  async createAutoFollowUp(params) {
    const {
      recordType,
      recordId,
      recordName,
      module,
      createdBy,
      additionalData = {},
    } = params;

    try {
      // Calculate next month's date for follow-up
      // Same day next month (clamped: 31 Jan -> end of Feb), 10:00 India time
      const nextMonth = nextMonthlyDueDate(new Date());

      // Create tracking record
      const trackingData = {
        recordType,
        recordId,
        recordName,
        module,
        title: `Monthly Follow-up - ${recordName}`,
        description: `Automatic monthly follow-up for ${recordType.toLowerCase()} record`,
        priority: "Medium",
        status: "Pending",
        category: MONTHLY_CATEGORY,
        followUpDate: nextMonth,
        createdBy,
        assignedTo: createdBy, // Assign to the creator by default
        ...additionalData, // Include wardNo, habitation, projectResponsible, tags, etc.
      };

      const tracking = await trackingService.createTracking(trackingData);
      console.log(`Auto follow-up created for ${recordType} - ${recordName}`);
      return tracking;
    } catch (error) {
      console.error("Error creating auto follow-up:", error);
      // Don't throw error - we don't want to fail the main record creation
      return null;
    }
  }

  /**
   * Add monthly update to existing tracking record
   * This should be called when a record is updated
   */
  async addAutoMonthlyUpdate(recordType, recordId, updateData, updatedBy) {
    try {
      // Find active tracking for this record
      const trackings = await trackingService.getTrackingByRecord(
        recordType,
        recordId
      );

      if (!trackings || trackings.length === 0) {
        console.log(`No active tracking found for ${recordType} - ${recordId}`);
        return null;
      }

      // Add update to the most recent active tracking
      const activeTracking = trackings.find(
        (t) => t.isActive && t.status !== "Completed"
      );

      if (!activeTracking) {
        console.log(
          `No active tracking to update for ${recordType} - ${recordId}`
        );
        return null;
      }

      const monthlyUpdate = {
        notes: updateData.notes || "Record updated",
        status: updateData.status || activeTracking.status,
        updatedBy,
      };

      const updated = await trackingService.addMonthlyUpdate(
        activeTracking._id,
        monthlyUpdate
      );

      console.log(
        `Monthly update added to tracking for ${recordType} - ${recordId}`
      );
      return updated;
    } catch (error) {
      console.error("Error adding auto monthly update:", error);
      return null;
    }
  }

  /**
   * Get module name based on record type
   */
  getModuleFromRecordType(recordType) {
    return MODULE_FOR_RECORD_TYPE[recordType] || "Health";
  }
}

export default new AutoTrackingService();
