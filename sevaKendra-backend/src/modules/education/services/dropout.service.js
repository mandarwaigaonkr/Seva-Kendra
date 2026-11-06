import Dropout from "../models/dropout.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class DropoutService {
  // Get all dropouts with pagination, search, and filters
  async getAllDropouts(query) {
    const {
      page = 1,
      limit = 10,
      search = "",
      wardNo = "",
      gender = "",
      enrollmentStatus = "",
      projectResponsible = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter = {};

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { householdCode: { $regex: escapeRegex(search), $options: "i" } },
        { habitation: { $regex: escapeRegex(search), $options: "i" } },
        { headOfHousehold: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    // Filter by ward number
    if (wardNo) {
      filter.wardNo = wardNo;
    }

    // Filter by gender
    if (gender) {
      filter.gender = gender;
    }

    // Filter by enrollment status
    if (enrollmentStatus) {
      filter.enrollmentStatus = enrollmentStatus;
    }

    // Filter by project responsible
    if (projectResponsible) {
      filter.projectResponsible = { $regex: escapeRegex(projectResponsible), $options: "i" };
    }

    const { skip, limitNum, page: pageNum } = getPaginationOptions(page, limit);
    const sortField = /^[A-Za-z_][\w.]{0,60}$/.test(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [dropouts, total] = await Promise.all([
      Dropout.find(filter)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Dropout.countDocuments(filter),
    ]);

    return {
      data: dropouts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get dropout by ID
  async getDropoutById(id) {
    const dropout = await Dropout.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!dropout) {
      throw new APIError(404, "Dropout record not found");
    }

    return dropout;
  }

  // Create a new dropout record
  async createDropout(data, userId) {
    // Check if household code already exists
    const existingDropout = await Dropout.findOne({
      householdCode: data.householdCode,
    });
    if (existingDropout) {
      throw new APIError(400, "Household code already exists");
    }

    const dropoutData = {
      ...data,
      createdBy: userId,
    };

    const dropout = new Dropout(dropoutData);
    await dropout.save();

    return await this.getDropoutById(dropout._id);
  }

  // Update dropout by ID
  async updateDropoutById(id, data, userId) {
    // Check if household code is being updated and already exists
    if (data.householdCode) {
      const existingDropout = await Dropout.findOne({
        householdCode: data.householdCode,
        _id: { $ne: id },
      });
      if (existingDropout) {
        throw new APIError(400, "Household code already exists");
      }
    }

    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const dropout = await Dropout.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!dropout) {
      throw new APIError(404, "Dropout record not found");
    }

    return await this.getDropoutById(id);
  }

  // Delete dropout by ID
  async deleteDropoutById(id) {
    const dropout = await Dropout.findByIdAndDelete(id);

    if (!dropout) {
      throw new APIError(404, "Dropout record not found");
    }

    return dropout;
  }

  // Get dropouts statistics
  async getDropoutsStats() {
    const [total, byGender, byWard, byEnrollmentStatus, byAge] =
      await Promise.all([
        Dropout.countDocuments(),
        Dropout.aggregate([{ $group: { _id: "$gender", count: { $sum: 1 } } }]),
        Dropout.aggregate([
          { $group: { _id: "$wardNo", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Dropout.aggregate([
          { $group: { _id: "$enrollmentStatus", count: { $sum: 1 } } },
        ]),
        Dropout.aggregate([
          {
            $group: {
              _id: {
                $switch: {
                  branches: [
                    { case: { $lte: ["$age", 12] }, then: "0-12" },
                    { case: { $lte: ["$age", 18] }, then: "13-18" },
                    { case: { $lte: ["$age", 25] }, then: "19-25" },
                  ],
                  default: "25+",
                },
              },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    return {
      total,
      byGender,
      byWard,
      byEnrollmentStatus,
      byAge,
    };
  }

  // Get unique values for filters
  async getFilterOptions() {
    const [wardNumbers, projectResponsibles, genders, enrollmentStatuses] =
      await Promise.all([
        Dropout.distinct("wardNo"),
        Dropout.distinct("projectResponsible"),
        Dropout.distinct("gender"),
        Dropout.distinct("enrollmentStatus"),
      ]);

    return {
      wardNumbers: wardNumbers.sort(),
      projectResponsibles: projectResponsibles.sort(),
      genders: genders.sort(),
      enrollmentStatuses: enrollmentStatuses.sort(),
    };
  }
}

export default new DropoutService();
