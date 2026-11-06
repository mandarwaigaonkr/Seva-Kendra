import Tuberculosis from "../models/tuberculosis.model.js";
import { escapeRegex } from "../../../utils/regex.utils.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";

class TuberculosisService {
  async createTuberculosis(data, userId) {
    const tuberculosis = new Tuberculosis({
      ...data,
      createdBy: userId,
    });
    return await tuberculosis.save();
  }

  async getAllTuberculosis(filters = {}, pagination = {}) {
    const { page, limit, skip } = getPaginationOptions(pagination);

    const query = {};

    // Apply filters
    if (filters.nikshaiId) {
      query.nikshaiId = { $regex: escapeRegex(filters.nikshaiId), $options: "i" };
    }
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
    if (filters.typeOfTB) {
      query.typeOfTB = filters.typeOfTB;
    }
    if (filters.overallStatus) {
      query.overallStatus = filters.overallStatus;
    }
    if (filters.projectResponsible) {
      query.projectResponsible = filters.projectResponsible;
    }

    const [tuberculosis, total] = await Promise.all([
      Tuberculosis.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean(),
      Tuberculosis.countDocuments(query),
    ]);

    return {
      tuberculosis,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTuberculosisById(id) {
    const tuberculosis = await Tuberculosis.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!tuberculosis) {
      throw new Error("Tuberculosis record not found");
    }

    return tuberculosis;
  }

  async updateTuberculosis(id, data, userId) {
    const tuberculosis = await Tuberculosis.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!tuberculosis) {
      throw new Error("Tuberculosis record not found");
    }

    return tuberculosis;
  }

  async deleteTuberculosis(id) {
    const tuberculosis = await Tuberculosis.findByIdAndDelete(id);

    if (!tuberculosis) {
      throw new Error("Tuberculosis record not found");
    }

    return tuberculosis;
  }

  async getTuberculosisStats() {
    const stats = await Tuberculosis.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          byType: [
            { $group: { _id: "$typeOfTB", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byStatus: [
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

export default new TuberculosisService();
