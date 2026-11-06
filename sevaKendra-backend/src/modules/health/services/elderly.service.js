import Elderly from "../models/elderly.model.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

/**
 * Create a new elderly record
 * @param {Object} elderlyData - Elderly data
 * @param {string} userId - ID of the user creating the elderly record
 * @returns {Promise<Object>} Created elderly record
 */
export const createElderly = async (elderlyData, userId) => {
  try {
    const elderly = new Elderly({
      ...elderlyData,
      createdBy: userId,
    });
    return await elderly.save();
  } catch (error) {
    throw error;
  }
};

/**
 * Get all elderly records with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Elderly records with pagination info
 */
export const getAllElderly = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      gender = "",
      wardNo = "",
      habitation = "",
      statusOfBankAccount = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    // Build filter query
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { householdCode: { $regex: escapeRegex(search), $options: "i" } },
        { uniqueId: { $regex: escapeRegex(search), $options: "i" } },
        { headOfHousehold: { $regex: escapeRegex(search), $options: "i" } },
        { habitation: { $regex: escapeRegex(search), $options: "i" } },
        { projectResponsible: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (gender && gender !== "all") {
      filter.gender = gender;
    }

    if (wardNo && wardNo !== "all") {
      filter.wardNo = wardNo;
    }

    if (habitation && habitation !== "all") {
      filter.habitation = { $regex: escapeRegex(habitation), $options: "i" };
    }

    if (statusOfBankAccount && statusOfBankAccount !== "all") {
      filter.statusOfBankAccount = statusOfBankAccount;
    }

    // Create pagination options
    const paginationOptions = getPaginationOptions({ page, limit });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const elderly = await Elderly.find(filter)
      .sort(sort)
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    const total = await Elderly.countDocuments(filter);

    return {
      elderly,
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
 * Get elderly record by ID
 * @param {string} id - Elderly record ID
 * @returns {Promise<Object>} Elderly record
 */
export const getElderlyById = async (id) => {
  try {
    const elderly = await Elderly.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!elderly) {
      throw new Error("Elderly record not found");
    }

    return elderly;
  } catch (error) {
    throw error;
  }
};

/**
 * Update elderly record by ID
 * @param {string} id - Elderly record ID
 * @param {Object} updateData - Update data
 * @param {string} userId - ID of the user updating the elderly record
 * @returns {Promise<Object>} Updated elderly record
 */
export const updateElderly = async (id, updateData, userId) => {
  try {
    const elderly = await Elderly.findByIdAndUpdate(
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

    if (!elderly) {
      throw new Error("Elderly record not found");
    }

    return elderly;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete elderly record by ID
 * @param {string} id - Elderly record ID
 * @returns {Promise<Object>} Deleted elderly record
 */
export const deleteElderly = async (id) => {
  try {
    const elderly = await Elderly.findByIdAndDelete(id);

    if (!elderly) {
      throw new Error("Elderly record not found");
    }

    return elderly;
  } catch (error) {
    throw error;
  }
};

/**
 * Get elderly statistics
 * @returns {Promise<Object>} Elderly statistics
 */
export const getElderlyStats = async () => {
  try {
    const stats = await Elderly.aggregate([
      {
        $group: {
          _id: null,
          totalElderly: { $sum: 1 },
          avgAge: { $avg: "$age" },
          maleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] },
          },
          femaleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] },
          },
          withBankAccount: {
            $sum: {
              $cond: [{ $eq: ["$statusOfBankAccount", "Available"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalElderly: 1,
          avgAge: { $round: ["$avgAge", 1] },
          maleCount: 1,
          femaleCount: 1,
          withBankAccount: 1,
          withoutBankAccount: {
            $subtract: ["$totalElderly", "$withBankAccount"],
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalElderly: 0,
        avgAge: 0,
        maleCount: 0,
        femaleCount: 0,
        withBankAccount: 0,
        withoutBankAccount: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};
