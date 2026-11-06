import OtherDiseases from "../models/otherDiseases.model.js";
import { escapeRegex } from "../../../utils/regex.utils.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";

class OtherDiseasesService {
  async createOtherDiseases(data, userId) {
    const otherDiseases = new OtherDiseases({
      ...data,
      createdBy: userId,
    });
    return await otherDiseases.save();
  }

  async getAllOtherDiseases(filters = {}, pagination = {}) {
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
    if (filters.natureOfIssue) {
      query.natureOfIssue = { $regex: escapeRegex(filters.natureOfIssue), $options: "i" };
    }
    if (filters.overallStatus) {
      query.overallStatus = filters.overallStatus;
    }
    if (filters.projectResponsible) {
      query.projectResponsible = filters.projectResponsible;
    }

    const [otherDiseases, total] = await Promise.all([
      OtherDiseases.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .lean(),
      OtherDiseases.countDocuments(query),
    ]);

    return {
      otherDiseases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOtherDiseasesById(id) {
    const otherDiseases = await OtherDiseases.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!otherDiseases) {
      throw new Error("Other Diseases record not found");
    }

    return otherDiseases;
  }

  async updateOtherDiseases(id, data, userId) {
    const otherDiseases = await OtherDiseases.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!otherDiseases) {
      throw new Error("Other Diseases record not found");
    }

    return otherDiseases;
  }

  async deleteOtherDiseases(id) {
    const otherDiseases = await OtherDiseases.findByIdAndDelete(id);

    if (!otherDiseases) {
      throw new Error("Other Diseases record not found");
    }

    return otherDiseases;
  }

  async getOtherDiseasesStats() {
    const stats = await OtherDiseases.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
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

export default new OtherDiseasesService();
