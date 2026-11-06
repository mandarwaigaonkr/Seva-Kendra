import HealthCamp from "../models/healthCamp.model.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

/**
 * Create a new health camp
 * @param {Object} healthCampData - Health camp data
 * @param {string} userId - ID of the user creating the health camp
 * @returns {Promise<Object>} Created health camp
 */
export const createHealthCamp = async (healthCampData, userId) => {
  try {
    const healthCamp = new HealthCamp({
      ...healthCampData,
      createdBy: userId,
    });
    return await healthCamp.save();
  } catch (error) {
    throw error;
  }
};

/**
 * Get all health camps with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Health camps with pagination info
 */
export const getAllHealthCamps = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      targetGroup = "",
      medicineType = "",
      specialisation = "",
      wardNo = "",
      habitation = "",
      village = "",
      typeOfHealthCamp = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    // Build filter query
    const filter = {};

    if (search) {
      filter.$or = [
        { targetGroup: { $regex: escapeRegex(search), $options: "i" } },
        { organiser: { $regex: escapeRegex(search), $options: "i" } },
        { habitation: { $regex: escapeRegex(search), $options: "i" } },
        { village: { $regex: escapeRegex(search), $options: "i" } },
        { projectResponsible: { $regex: escapeRegex(search), $options: "i" } },
        { majorFindings: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (targetGroup && targetGroup !== "all") {
      filter.targetGroup = { $regex: escapeRegex(targetGroup), $options: "i" };
    }

    if (medicineType && medicineType !== "all") {
      filter.medicineType = medicineType;
    }

    if (specialisation && specialisation !== "all") {
      filter.specialisation = { $regex: escapeRegex(specialisation), $options: "i" };
    }

    if (wardNo && wardNo !== "all") {
      filter.wardNo = wardNo;
    }

    if (habitation && habitation !== "all") {
      filter.habitation = { $regex: escapeRegex(habitation), $options: "i" };
    }

    if (village && village !== "all") {
      filter.village = { $regex: escapeRegex(village), $options: "i" };
    }

    if (typeOfHealthCamp && typeOfHealthCamp !== "all") {
      filter.typeOfHealthCamp = typeOfHealthCamp;
    }

    // Create pagination options
    const paginationOptions = getPaginationOptions({ page, limit });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const healthCamps = await HealthCamp.find(filter)
      .sort(sort)
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    const total = await HealthCamp.countDocuments(filter);

    return {
      healthCamps,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get health camp by ID
 * @param {string} id - Health camp ID
 * @returns {Promise<Object>} Health camp
 */
export const getHealthCampById = async (id) => {
  try {
    const healthCamp = await HealthCamp.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!healthCamp) {
      throw new Error("Health camp not found");
    }

    return healthCamp;
  } catch (error) {
    throw error;
  }
};

/**
 * Update health camp by ID
 * @param {string} id - Health camp ID
 * @param {Object} updateData - Update data
 * @param {string} userId - ID of the user updating the health camp
 * @returns {Promise<Object>} Updated health camp
 */
export const updateHealthCamp = async (id, updateData, userId) => {
  try {
    const healthCamp = await HealthCamp.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: userId,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!healthCamp) {
      throw new Error("Health camp not found");
    }

    return healthCamp;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete health camp by ID
 * @param {string} id - Health camp ID
 * @returns {Promise<Object>} Deleted health camp
 */
export const deleteHealthCamp = async (id) => {
  try {
    const healthCamp = await HealthCamp.findByIdAndDelete(id);

    if (!healthCamp) {
      throw new Error("Health camp not found");
    }

    return healthCamp;
  } catch (error) {
    throw error;
  }
};

/**
 * Get health camp statistics
 * @returns {Promise<Object>} Health camp statistics
 */
export const getHealthCampStats = async () => {
  try {
    const stats = await HealthCamp.aggregate([
      {
        $group: {
          _id: null,
          totalCamps: { $sum: 1 },
          totalBeneficiaries: { $sum: "$totalBeneficiaries" },
          totalDoctors: { $sum: "$numberOfDoctors" },
          totalGDA: { $sum: "$numberOfGDA" },
          avgBeneficiariesPerCamp: { $avg: "$totalBeneficiaries" },
        },
      },
      {
        $project: {
          _id: 0,
          totalCamps: 1,
          totalBeneficiaries: 1,
          totalDoctors: 1,
          totalGDA: 1,
          avgBeneficiariesPerCamp: { $round: ["$avgBeneficiariesPerCamp", 2] },
        },
      },
    ]);

    return (
      stats[0] || {
        totalCamps: 0,
        totalBeneficiaries: 0,
        totalDoctors: 0,
        totalGDA: 0,
        avgBeneficiariesPerCamp: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};
