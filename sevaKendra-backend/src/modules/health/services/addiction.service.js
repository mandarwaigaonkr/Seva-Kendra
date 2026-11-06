import Addiction from "../models/addiction.model.js";
import { escapeRegex } from "../../../utils/regex.utils.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";

class AddictionService {
  async createAddiction(data, userId) {
    const addiction = new Addiction({
      ...data,
      createdBy: userId,
    });
    return await addiction.save();
  }

  async getAllAddiction(filters = {}, pagination = {}) {
    const { page, limit, skip } = getPaginationOptions(pagination);

    const query = {};

    // Apply filters
    if (filters.caseId) {
      query.caseId = { $regex: escapeRegex(filters.caseId), $options: "i" };
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
    if (filters.typeOfSubstancesUsed) {
      query.typeOfSubstancesUsed = {
        $regex: escapeRegex(filters.typeOfSubstancesUsed),
        $options: "i",
      };
    }
    if (filters.statusOfLinkageWithSkillDevelopment) {
      query.statusOfLinkageWithSkillDevelopment =
        filters.statusOfLinkageWithSkillDevelopment;
    }
    if (filters.overallStatus) {
      query.overallStatus = filters.overallStatus;
    }
    if (filters.projectResponsible) {
      query.projectResponsible = filters.projectResponsible;
    }

    const [addiction, total] = await Promise.all([
      Addiction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean(),
      Addiction.countDocuments(query),
    ]);

    return {
      addiction,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAddictionById(id) {
    const addiction = await Addiction.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!addiction) {
      throw new Error("Addiction record not found");
    }

    return addiction;
  }

  async updateAddiction(id, data, userId) {
    const addiction = await Addiction.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!addiction) {
      throw new Error("Addiction record not found");
    }

    return addiction;
  }

  async deleteAddiction(id) {
    const addiction = await Addiction.findByIdAndDelete(id);

    if (!addiction) {
      throw new Error("Addiction record not found");
    }

    return addiction;
  }

  async getAddictionStats() {
    const stats = await Addiction.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          bySkillLinkageStatus: [
            {
              $group: {
                _id: "$statusOfLinkageWithSkillDevelopment",
                count: { $sum: 1 },
              },
            },
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

export default new AddictionService();
