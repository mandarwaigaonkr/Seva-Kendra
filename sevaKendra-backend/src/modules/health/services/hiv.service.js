import HIV from "../models/hiv.model.js";
import { escapeRegex } from "../../../utils/regex.utils.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";

class HIVService {
  async createHIV(data, userId) {
    const hiv = new HIV({
      ...data,
      createdBy: userId,
    });
    return await hiv.save();
  }

  async getAllHIV(filters = {}, pagination = {}) {
    const { page, limit, skip } = getPaginationOptions(pagination);

    const query = {};

    // Apply filters
    if (filters.name) {
      query.name = { $regex: escapeRegex(filters.name), $options: "i" };
    }
    if (filters.gender) {
      query.gender = filters.gender;
    }
    if (filters.wardNo) {
      query.wardNo = filters.wardNo;
    }
    if (filters.habitation) {
      query.habitation = { $regex: escapeRegex(filters.habitation), $options: "i" };
    }
    if (filters.householdCode) {
      query.householdCode = { $regex: escapeRegex(filters.householdCode), $options: "i" };
    }
    if (filters.hivStage) {
      query.hivStage = filters.hivStage;
    }
    if (filters.statusOfTreatment) {
      query.statusOfTreatment = filters.statusOfTreatment;
    }
    if (filters.overallStatus) {
      query.overallStatus = filters.overallStatus;
    }
    if (filters.projectResponsible) {
      query.projectResponsible = filters.projectResponsible;
    }

    const [hiv, total] = await Promise.all([
      HIV.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean(),
      HIV.countDocuments(query),
    ]);

    return {
      hiv,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getHIVById(id) {
    const hiv = await HIV.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!hiv) {
      throw new Error("HIV record not found");
    }

    return hiv;
  }

  async updateHIV(id, data, userId) {
    const hiv = await HIV.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!hiv) {
      throw new Error("HIV record not found");
    }

    return hiv;
  }

  async deleteHIV(id) {
    const hiv = await HIV.findByIdAndDelete(id);

    if (!hiv) {
      throw new Error("HIV record not found");
    }

    return hiv;
  }

  async getHIVStats() {
    const stats = await HIV.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          byStage: [
            { $group: { _id: "$hivStage", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byTreatmentStatus: [
            { $group: { _id: "$statusOfTreatment", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byOverallStatus: [
            { $group: { _id: "$overallStatus", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byGender: [
            { $group: { _id: "$gender", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          ageDistribution: [
            {
              $bucket: {
                groupBy: "$age",
                boundaries: [0, 18, 35, 50, 65, 120],
                default: "Other",
                output: { count: { $sum: 1 } },
              },
            },
          ],
        },
      },
    ]);

    return stats[0];
  }
}

export default new HIVService();
