import Leprosy from "../models/leprosy.model.js";
import { escapeRegex } from "../../../utils/regex.utils.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";

class LeprosyService {
  async createLeprosy(data, userId) {
    const leprosy = new Leprosy({
      ...data,
      createdBy: userId,
    });
    return await leprosy.save();
  }

  async getAllLeprosy(filters = {}, pagination = {}) {
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
    if (filters.typeOfLeprosy) {
      query.typeOfLeprosy = filters.typeOfLeprosy;
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

    const [leprosy, total] = await Promise.all([
      Leprosy.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean(),
      Leprosy.countDocuments(query),
    ]);

    return {
      leprosy,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLeprosyById(id) {
    const leprosy = await Leprosy.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!leprosy) {
      throw new Error("Leprosy record not found");
    }

    return leprosy;
  }

  async updateLeprosy(id, data, userId) {
    const leprosy = await Leprosy.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!leprosy) {
      throw new Error("Leprosy record not found");
    }

    return leprosy;
  }

  async deleteLeprosy(id) {
    const leprosy = await Leprosy.findByIdAndDelete(id);

    if (!leprosy) {
      throw new Error("Leprosy record not found");
    }

    return leprosy;
  }

  async getLeprosyStats() {
    const stats = await Leprosy.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          byType: [
            { $group: { _id: "$typeOfLeprosy", count: { $sum: 1 } } },
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

export default new LeprosyService();
