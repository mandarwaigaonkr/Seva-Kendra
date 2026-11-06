import BoardPreparation from "../models/boardPreparation.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class BoardPreparationService {
  // Get all board preparation records with pagination, search, and filters
  async getAllBoardPreparations(query) {
    const {
      page = 1,
      limit = 10,
      search = "",
      wardNo = "",
      gender = "",
      educationalStandard = "",
      status = "",
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

    // Filter by educational standard
    if (educationalStandard) {
      filter.educationalStandard = educationalStandard;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by project responsible
    if (projectResponsible) {
      filter.projectResponsible = { $regex: escapeRegex(projectResponsible), $options: "i" };
    }

    const { skip, limitNum, page: pageNum } = getPaginationOptions(page, limit);
    const sortField = /^[A-Za-z_][\w.]{0,60}$/.test(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [preparations, total] = await Promise.all([
      BoardPreparation.find(filter)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BoardPreparation.countDocuments(filter),
    ]);

    return {
      data: preparations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get board preparation by ID
  async getBoardPreparationById(id) {
    const preparation = await BoardPreparation.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!preparation) {
      throw new APIError(404, "Board preparation record not found");
    }

    return preparation;
  }

  // Create a new board preparation record
  async createBoardPreparation(data, userId) {
    // Check if household code already exists
    const existingPreparation = await BoardPreparation.findOne({
      householdCode: data.householdCode,
    });
    if (existingPreparation) {
      throw new APIError(400, "Household code already exists");
    }

    const preparationData = {
      ...data,
      createdBy: userId,
    };

    const preparation = new BoardPreparation(preparationData);
    await preparation.save();

    return await this.getBoardPreparationById(preparation._id);
  }

  // Update board preparation by ID
  async updateBoardPreparationById(id, data, userId) {
    // Check if household code is being updated and already exists
    if (data.householdCode) {
      const existingPreparation = await BoardPreparation.findOne({
        householdCode: data.householdCode,
        _id: { $ne: id },
      });
      if (existingPreparation) {
        throw new APIError(400, "Household code already exists");
      }
    }

    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const preparation = await BoardPreparation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!preparation) {
      throw new APIError(404, "Board preparation record not found");
    }

    return await this.getBoardPreparationById(id);
  }

  // Delete board preparation by ID
  async deleteBoardPreparationById(id) {
    const preparation = await BoardPreparation.findByIdAndDelete(id);

    if (!preparation) {
      throw new APIError(404, "Board preparation record not found");
    }

    return preparation;
  }

  // Get board preparations statistics
  async getBoardPreparationsStats() {
    const [total, byGender, byWard, byEducationalStandard, byStatus] =
      await Promise.all([
        BoardPreparation.countDocuments(),
        BoardPreparation.aggregate([
          { $group: { _id: "$gender", count: { $sum: 1 } } },
        ]),
        BoardPreparation.aggregate([
          { $group: { _id: "$wardNo", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        BoardPreparation.aggregate([
          { $group: { _id: "$educationalStandard", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        BoardPreparation.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

    return {
      total,
      byGender,
      byWard,
      byEducationalStandard,
      byStatus,
    };
  }

  // Get unique values for filters
  async getFilterOptions() {
    const [
      wardNumbers,
      projectResponsibles,
      genders,
      educationalStandards,
      statuses,
    ] = await Promise.all([
      BoardPreparation.distinct("wardNo"),
      BoardPreparation.distinct("projectResponsible"),
      BoardPreparation.distinct("gender"),
      BoardPreparation.distinct("educationalStandard"),
      BoardPreparation.distinct("status"),
    ]);

    return {
      wardNumbers: wardNumbers.sort(),
      projectResponsibles: projectResponsibles.sort(),
      genders: genders.sort(),
      educationalStandards: educationalStandards.sort(),
      statuses: statuses.sort(),
    };
  }
}

export default new BoardPreparationService();
