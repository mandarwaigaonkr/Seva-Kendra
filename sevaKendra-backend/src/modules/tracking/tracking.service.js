import Tracking from "./tracking.model.js";
import mongoose from "mongoose";
import { escapeRegex } from "../../utils/regex.utils.js";
import { APIError } from "../../errors/apiError.js";
import {
  EDITABLE_FIELDS,
  LIMITS,
  MONTHLY_CATEGORY,
  OPEN_STATUSES,
  cleanEditable,
  isMonthlyFollowUp,
  moduleForRecordType,
  nextMonthlyDueDate,
  pick,
  scoped,
} from "./tracking.access.js";

/**
 * Every method that reads or changes follow-ups takes `modules`: the domains the caller
 * may act in (from trackingScope). Pass `undefined` only from trusted server code, such as
 * auto follow-ups created when a record is saved.
 */

// A follow-up is one of: open (isActive), completed (inactive, Completed) or closed
// (inactive, Cancelled: cancelled by a user, deleted, or its record was deleted).
// Only open ones can be changed; open and completed ones can be viewed.
const VISIBLE = { $or: [{ isActive: true }, { status: "Completed" }] };
const SORTABLE = new Set(["followUpDate", "createdAt", "updatedAt", "priority", "status", "recordName", "title"]);

const POPULATE_USERS = [
  { path: "createdBy", select: "firstName lastName email" },
  { path: "assignedTo", select: "firstName lastName email" },
  { path: "monthlyUpdates.updatedBy", select: "firstName lastName" },
];

const notFound = () => new APIError("Follow-up not found", 404);

const validated = (fields) => {
  try {
    return cleanEditable(fields);
  } catch (error) {
    throw new APIError(error.message, 400);
  }
};

const cleanNotes = (notes, { required = false } = {}) => {
  const text = typeof notes === "string" ? notes.trim() : "";
  if (required && !text) throw new APIError("Write a note for this update", 400);
  if (text.length > LIMITS.text) throw new APIError(`Notes can be up to ${LIMITS.text} characters`, 400);
  return text;
};

const toObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  return new mongoose.Types.ObjectId(String(id));
};

const safeSort = (sort) => {
  const raw = String(sort || "-followUpDate");
  const field = raw.replace(/^-/, "");
  return SORTABLE.has(field) ? raw : "-followUpDate";
};

const overdueFilter = () => ({ status: { $in: OPEN_STATUSES }, followUpDate: { $lt: new Date() } });

class TrackingService {
  async createTracking(trackingData) {
    const tracking = new Tracking(trackingData);
    return await tracking.save();
  }

  /**
   * Creates a follow-up on behalf of a user. The domain always comes from the record type
   * (never from the request), and the caller must hold `create` in that domain.
   */
  async createForUser(body, userId, modules) {
    const module = moduleForRecordType(body?.recordType);
    if (!module) throw new APIError("Choose what kind of record this follow-up is for", 400);
    if (!modules.includes(module)) {
      throw new APIError(`You don't have permission to add ${module} follow-ups`, 403);
    }
    if (!mongoose.isValidObjectId(body.recordId)) {
      throw new APIError("The record this follow-up belongs to is missing", 400);
    }
    return this.createTracking({
      ...validated(pick(body, EDITABLE_FIELDS)),
      recordType: body.recordType,
      recordId: body.recordId,
      recordName: body.recordName,
      module,
      createdBy: userId,
    });
  }

  async getAllTracking(filters = {}, options = {}, modules) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(options.limit, 10) || 10)); // Follow-ups page loads up to 500
    const sort = safeSort(options.sort);
    const populate = options.populate !== false;

    const query = { isActive: true };
    for (const key of ["recordType", "module", "status", "priority", "wardNo", "habitation", "projectResponsible"]) {
      if (filters[key]) query[key] = String(filters[key]);
    }
    for (const key of ["assignedTo", "createdBy"]) {
      if (filters[key]) {
        if (!mongoose.isValidObjectId(filters[key])) throw new APIError(`Invalid ${key}`, 400);
        query[key] = filters[key];
      }
    }

    if (filters.followUpDateFrom || filters.followUpDateTo) {
      query.followUpDate = {};
      if (filters.followUpDateFrom) query.followUpDate.$gte = new Date(filters.followUpDateFrom);
      if (filters.followUpDateTo) query.followUpDate.$lte = new Date(filters.followUpDateTo);
    }

    // Overdue is worked out from the due date at query time, not from a stored flag.
    if (filters.isOverdue === "true" || filters.isOverdue === true) {
      const overdue = overdueFilter();
      query.followUpDate = { ...(query.followUpDate || {}), ...overdue.followUpDate };
      if (!query.status) query.status = overdue.status;
    }

    if (filters.search) {
      const pattern = escapeRegex(filters.search);
      query.$or = [
        { title: { $regex: pattern, $options: "i" } },
        { recordName: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ];
    }

    const finalQuery = scoped(query, modules);
    let queryBuilder = Tracking.find(finalQuery).sort(sort).skip((page - 1) * limit).limit(limit);
    if (populate) queryBuilder = queryBuilder.populate(POPULATE_USERS);

    const [trackings, total] = await Promise.all([queryBuilder.exec(), Tracking.countDocuments(finalQuery)]);

    return {
      trackings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTrackingById(id, modules) {
    return await Tracking.findOne(scoped({ _id: toObjectId(id), ...VISIBLE }, modules)).populate(POPULATE_USERS);
  }

  /** Loads an open follow-up the caller may change, or throws 404. */
  async findOwned(id, modules) {
    const tracking = await Tracking.findOne(scoped({ _id: toObjectId(id), isActive: true }, modules));
    if (!tracking) throw notFound();
    return tracking;
  }

  async getTrackingByRecord(recordType, recordId, modules) {
    return await Tracking.find(
      scoped({ recordType, recordId: toObjectId(recordId), isActive: true }, modules)
    )
      .populate(POPULATE_USERS.slice(0, 2))
      .sort("-followUpDate");
  }

  /** PATCH: only the fields in EDITABLE_FIELDS; saved through the document so hooks run. */
  async updateTracking(id, updateData, modules) {
    const tracking = await this.findOwned(id, modules);
    tracking.set(validated(pick(updateData, EDITABLE_FIELDS)));
    await tracking.save();
    return await Tracking.findById(tracking._id).populate(POPULATE_USERS.slice(0, 2));
  }

  async addMonthlyUpdate(id, updateData, modules) {
    const tracking = await this.findOwned(id, modules);
    const notes = cleanNotes(updateData?.notes, { required: true });
    if (updateData?.status !== undefined && !OPEN_STATUSES.includes(updateData.status)) {
      throw new APIError(`Status can be ${OPEN_STATUSES.join(", ")}. Use Complete or Cancel to close a follow-up.`, 400);
    }
    if (tracking.monthlyUpdates.length >= 500) throw new APIError("This follow-up has too many updates", 400);
    await tracking.addMonthlyUpdate({
      notes,
      status: updateData.status || tracking.status,
      date: updateData.date || new Date(),
      updatedBy: updateData.updatedBy,
    });
    return await Tracking.findById(id).populate(POPULATE_USERS);
  }

  /**
   * Marks a follow-up done. A monthly follow-up then schedules the next month's visit, so
   * every open record keeps exactly one follow-up due.
   */
  async completeTracking(id, notes, completedBy, modules) {
    const text = cleanNotes(notes) || "Follow-up completed";
    const now = new Date();
    // Atomic: only one request can move an open follow-up to Completed, so concurrent
    // clicks cannot schedule more than one next follow-up.
    const tracking = await Tracking.findOneAndUpdate(
      scoped({ _id: toObjectId(id), isActive: true, status: { $in: OPEN_STATUSES } }, modules),
      {
        $set: { status: "Completed", completedDate: now, completionNotes: text, isActive: false, isOverdue: false },
        $push: { monthlyUpdates: { date: now, notes: text, status: "Completed", updatedBy: completedBy } },
      },
      { new: true }
    );
    if (!tracking) {
      const done = await Tracking.findOne(scoped({ _id: toObjectId(id), status: "Completed" }, modules));
      if (done) return { tracking: done, next: null }; // already completed: idempotent
      throw notFound();
    }

    let next = null;
    if (isMonthlyFollowUp(tracking)) {
      next = await this.createTracking({
        recordType: tracking.recordType,
        recordId: tracking.recordId,
        recordName: tracking.recordName,
        module: tracking.module,
        title: tracking.title,
        description: tracking.description,
        priority: tracking.priority,
        status: "Pending",
        category: MONTHLY_CATEGORY,
        followUpDate: nextMonthlyDueDate(tracking.completedDate || new Date()),
        createdBy: completedBy,
        assignedTo: tracking.assignedTo,
        wardNo: tracking.wardNo,
        habitation: tracking.habitation,
        projectResponsible: tracking.projectResponsible,
        tags: tracking.tags,
      });
    }

    const completed = await Tracking.findById(id).populate(POPULATE_USERS.slice(0, 2));
    return { tracking: completed, next };
  }

  async cancelTracking(id, reason, cancelledBy, modules) {
    const tracking = await this.findOwned(id, modules);
    const text = cleanNotes(reason);
    tracking.status = "Cancelled";
    tracking.isActive = false;
    tracking.completionNotes = text;
    tracking.monthlyUpdates.push({
      date: new Date(),
      notes: text || "Follow-up cancelled",
      status: "Cancelled",
      updatedBy: cancelledBy,
    });
    await tracking.save();
    return await Tracking.findById(id).populate(POPULATE_USERS.slice(0, 2));
  }

  /** Soft delete: the follow-up disappears from lists but its history is kept. */
  async deleteTracking(id, modules) {
    const tracking = await Tracking.findOne(scoped({ _id: toObjectId(id), ...VISIBLE }, modules));
    if (!tracking) throw notFound();
    tracking.isActive = false;
    tracking.status = "Cancelled";
    tracking.completionNotes = "Deleted";
    await tracking.save();
    return tracking;
  }

  /** Called when the underlying record is deleted, so no follow-up outlives its record. */
  async deactivateForRecord(recordType, recordId) {
    if (!mongoose.isValidObjectId(recordId)) return 0;
    const result = await Tracking.updateMany(
      { recordType, recordId: new mongoose.Types.ObjectId(String(recordId)), isActive: true },
      { $set: { isActive: false, status: "Cancelled", completionNotes: "Record deleted" } }
    );
    return result.modifiedCount || 0;
  }

  async getOverdueTracking(modules) {
    return await Tracking.find(scoped({ isActive: true, ...overdueFilter() }, modules))
      .populate(POPULATE_USERS.slice(0, 2))
      .sort("followUpDate");
  }

  async getUpcomingTracking(days = 7, modules) {
    const span = Math.min(365, Math.max(1, Number(days) || 7));
    const now = new Date();
    const until = new Date(now.getTime() + span * 24 * 60 * 60 * 1000);
    return await Tracking.find(
      scoped({ isActive: true, status: { $in: OPEN_STATUSES }, followUpDate: { $gte: now, $lte: until } }, modules)
    )
      .populate(POPULATE_USERS.slice(0, 2))
      .sort("followUpDate");
  }

  async getTrackingStats(filters = {}, modules) {
    const base = {};
    if (filters.module) base.module = String(filters.module);
    if (filters.recordType) base.recordType = String(filters.recordType);
    if (filters.assignedTo) {
      if (!mongoose.isValidObjectId(filters.assignedTo)) throw new APIError("Invalid assignedTo", 400);
      base.assignedTo = new mongoose.Types.ObjectId(String(filters.assignedTo));
    }

    const baseQuery = scoped(base, modules); // includes completed (inactive) follow-ups
    const query = { ...baseQuery, isActive: true };

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const group = (field) => Tracking.aggregate([{ $match: query }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]);

    const [total, pending, inProgress, completed, overdue, completedThisMonth, byModule, byPriority, byStatus] =
      await Promise.all([
        Tracking.countDocuments(query),
        Tracking.countDocuments({ ...query, status: "Pending" }),
        Tracking.countDocuments({ ...query, status: "In Progress" }),
        Tracking.countDocuments({ ...baseQuery, status: "Completed" }),
        Tracking.countDocuments({ ...query, ...overdueFilter() }),
        Tracking.countDocuments({ ...baseQuery, status: "Completed", completedDate: { $gte: startOfMonth } }),
        group("module"),
        group("priority"),
        group("status"),
      ]);

    const toMap = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));
    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completedThisMonth,
      byModule: toMap(byModule),
      byPriority: toMap(byPriority),
      byStatus: toMap(byStatus),
    };
  }

  async getMonthlyUpdateHistory(recordType, recordId, modules) {
    const trackings = await Tracking.find(scoped({ recordType, recordId: toObjectId(recordId), completionNotes: { $nin: ["Deleted", "Record deleted"] } }, modules))
      .select("monthlyUpdates title")
      .populate("monthlyUpdates.updatedBy", "firstName lastName")
      .sort("-createdAt");

    const allUpdates = [];
    trackings.forEach((tracking) => {
      tracking.monthlyUpdates.forEach((update) => {
        allUpdates.push({ ...update.toObject(), trackingTitle: tracking.title, trackingId: tracking._id });
      });
    });
    allUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));
    return allUpdates;
  }

  /** Keeps the stored isOverdue flag in step with the due date (both directions). */
  async updateOverdueStatus() {
    const now = new Date();
    await Promise.all([
      Tracking.updateMany(
        { isActive: true, status: { $in: OPEN_STATUSES }, followUpDate: { $lt: now }, isOverdue: { $ne: true } },
        { $set: { isOverdue: true } }
      ),
      Tracking.updateMany(
        { isOverdue: true, $or: [{ followUpDate: { $gte: now } }, { status: { $nin: OPEN_STATUSES } }] },
        { $set: { isOverdue: false } }
      ),
    ]);
  }

  async getUrgentCases(options = {}, modules) {
    const query = { isActive: true, priority: "Urgent" };
    if (options.status) query.status = String(options.status);
    if (options.assignedTo && mongoose.isValidObjectId(options.assignedTo)) query.assignedTo = options.assignedTo;

    return Tracking.find(scoped(query, modules))
      .populate(POPULATE_USERS.slice(0, 2))
      .sort({ updatedAt: 1 });
  }

  async getUrgentCaseStaleAlerts(staleAfterDays = 2, modules) {
    const days = Math.min(365, Math.max(1, Number(staleAfterDays) || 2));
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await Tracking.find(
      scoped({ isActive: true, priority: "Urgent", status: { $in: OPEN_STATUSES }, updatedAt: { $lt: cutoffDate } }, modules)
    )
      .populate("assignedTo", "firstName lastName email")
      .sort({ updatedAt: 1 });

    return records.map((record) => ({
      id: record._id,
      title: record.title,
      recordName: record.recordName,
      assignedTo: record.assignedTo,
      lastUpdated: record.updatedAt,
      staleDays: Math.floor((Date.now() - new Date(record.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }
}

export default new TrackingService();
