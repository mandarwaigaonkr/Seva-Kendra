import trackingService from "./tracking.service.js";
import { allowedModules } from "./tracking.access.js";

/**
 * Thin HTTP layer over trackingService. `req.trackingModules` (set by trackingScope in the
 * router) limits every call to the domains the caller holds the needed permission in.
 * Errors go to the shared errorHandler, which hides internal details on 500s.
 */
const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    next(error);
  }
};

const userId = (req) => req.user._id || req.user.id;

// Write permission is not read permission: someone who may only edit (or create) Health
// follow-ups gets an acknowledgement back, not the record's contents.
const visible = (req, doc) => {
  if (!doc) return doc;
  return allowedModules(req.user, "view").includes(doc.module) ? doc : { _id: doc._id, module: doc.module };
};

class TrackingController {
  createTracking = handle(async (req, res) => {
    const tracking = await trackingService.createForUser(req.body, userId(req), req.trackingModules);
    res.status(201).json({ success: true, message: "Follow-up tracking created successfully", data: visible(req, tracking) });
  });

  getAllTracking = handle(async (req, res) => {
    const q = req.query;
    const result = await trackingService.getAllTracking(
      {
        recordType: q.recordType,
        module: q.module,
        status: q.status,
        priority: q.priority,
        assignedTo: q.assignedTo,
        createdBy: q.createdBy,
        wardNo: q.wardNo,
        habitation: q.habitation,
        projectResponsible: q.projectResponsible,
        followUpDateFrom: q.followUpDateFrom,
        followUpDateTo: q.followUpDateTo,
        isOverdue: q.isOverdue,
        search: q.search,
      },
      { page: q.page, limit: q.limit, sort: q.sort, populate: q.populate !== "false" },
      req.trackingModules
    );
    res.status(200).json({ success: true, data: result.trackings, pagination: result.pagination });
  });

  getTrackingById = handle(async (req, res) => {
    const tracking = await trackingService.getTrackingById(req.params.id, req.trackingModules);
    if (!tracking) return res.status(404).json({ success: false, message: "Follow-up not found" });
    res.status(200).json({ success: true, data: tracking });
  });

  getTrackingByRecord = handle(async (req, res) => {
    const { recordType, recordId } = req.params;
    const data = await trackingService.getTrackingByRecord(recordType, recordId, req.trackingModules);
    res.status(200).json({ success: true, data });
  });

  updateTracking = handle(async (req, res) => {
    const tracking = await trackingService.updateTracking(req.params.id, req.body, req.trackingModules);
    res.status(200).json({ success: true, message: "Tracking record updated successfully", data: visible(req, tracking) });
  });

  addMonthlyUpdate = handle(async (req, res) => {
    const tracking = await trackingService.addMonthlyUpdate(
      req.params.id,
      { ...req.body, updatedBy: userId(req) },
      req.trackingModules
    );
    res.status(200).json({ success: true, message: "Monthly update added successfully", data: visible(req, tracking) });
  });

  completeTracking = handle(async (req, res) => {
    const { tracking, next } = await trackingService.completeTracking(
      req.params.id,
      req.body?.notes,
      userId(req),
      req.trackingModules
    );
    res.status(200).json({
      success: true,
      message: next ? "Follow-up completed. Next month's follow-up is scheduled." : "Follow-up marked as completed",
      data: visible(req, tracking),
      next: visible(req, next),
    });
  });

  cancelTracking = handle(async (req, res) => {
    const tracking = await trackingService.cancelTracking(req.params.id, req.body?.reason, userId(req), req.trackingModules);
    res.status(200).json({ success: true, message: "Follow-up cancelled successfully", data: visible(req, tracking) });
  });

  deleteTracking = handle(async (req, res) => {
    await trackingService.deleteTracking(req.params.id, req.trackingModules);
    res.status(200).json({ success: true, message: "Tracking record deleted successfully" });
  });

  getOverdueTracking = handle(async (req, res) => {
    const data = await trackingService.getOverdueTracking(req.trackingModules);
    res.status(200).json({ success: true, data, count: data.length });
  });

  getUpcomingTracking = handle(async (req, res) => {
    const data = await trackingService.getUpcomingTracking(req.query.days, req.trackingModules);
    res.status(200).json({ success: true, data, count: data.length });
  });

  getTrackingStats = handle(async (req, res) => {
    const data = await trackingService.getTrackingStats(
      { module: req.query.module, assignedTo: req.query.assignedTo, recordType: req.query.recordType },
      req.trackingModules
    );
    res.status(200).json({ success: true, data });
  });

  getUrgentCases = handle(async (req, res) => {
    const data = await trackingService.getUrgentCases(
      { status: req.query.status, assignedTo: req.query.assignedTo },
      req.trackingModules
    );
    res.status(200).json({ success: true, data });
  });

  getUrgentCaseAlerts = handle(async (req, res) => {
    // Same clamp as the service, so the response says which window was actually used.
    const staleAfterDays = Math.min(365, Math.max(1, Number(req.query.staleAfterDays) || 2));
    const data = await trackingService.getUrgentCaseStaleAlerts(staleAfterDays, req.trackingModules);
    res.status(200).json({ success: true, data, staleAfterDays });
  });

  getMonthlyUpdateHistory = handle(async (req, res) => {
    const { recordType, recordId } = req.params;
    const data = await trackingService.getMonthlyUpdateHistory(recordType, recordId, req.trackingModules);
    res.status(200).json({ success: true, data });
  });
}

export default new TrackingController();
