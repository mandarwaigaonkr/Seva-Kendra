import MotherChild from "../models/motherChild.model.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

/**
 * Create a new mother child record
 * @param {Object} motherChildData - Mother child data
 * @param {string} userId - ID of the user creating the mother child record
 * @returns {Promise<Object>} Created mother child record
 */
export const createMotherChild = async (motherChildData, userId) => {
  try {
    const motherChild = new MotherChild({
      ...motherChildData,
      createdBy: userId,
    });
    return await motherChild.save();
  } catch (error) {
    throw error;
  }
};

/**
 * Get all mother child records with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Mother child records with pagination info
 */
export const getAllMotherChild = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      gender = "",
      wardNo = "",
      habitation = "",
      immunizationStatus = "",
      nutritionalStatus = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    // Build filter query
    const filter = {};

    if (search) {
      filter.$or = [
        { nameOfMother: { $regex: escapeRegex(search), $options: "i" } },
        { nameOfChild: { $regex: escapeRegex(search), $options: "i" } },
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

    if (immunizationStatus && immunizationStatus !== "all") {
      filter.immunizationStatus = immunizationStatus;
    }

    if (nutritionalStatus && nutritionalStatus !== "all") {
      filter.nutritionalStatus = nutritionalStatus;
    }

    // Create pagination query
    const paginationOptions = getPaginationOptions({ page, limit });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const motherChild = await MotherChild.find(filter)
      .sort(sort)
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    const total = await MotherChild.countDocuments(filter);

    return {
      motherChild,
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
 * Get mother child record by ID
 * @param {string} id - Mother child record ID
 * @returns {Promise<Object>} Mother child record
 */
export const getMotherChildById = async (id) => {
  try {
    const motherChild = await MotherChild.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!motherChild) {
      throw new Error("Mother child record not found");
    }

    return motherChild;
  } catch (error) {
    throw error;
  }
};

/**
 * Update mother child record by ID
 * @param {string} id - Mother child record ID
 * @param {Object} updateData - Update data
 * @param {string} userId - ID of the user updating the mother child record
 * @returns {Promise<Object>} Updated mother child record
 */
export const updateMotherChild = async (id, updateData, userId) => {
  try {
    const motherChild = await MotherChild.findByIdAndUpdate(
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

    if (!motherChild) {
      throw new Error("Mother child record not found");
    }

    return motherChild;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete mother child record by ID
 * @param {string} id - Mother child record ID
 * @returns {Promise<Object>} Deleted mother child record
 */
export const deleteMotherChild = async (id) => {
  try {
    const motherChild = await MotherChild.findByIdAndDelete(id);

    if (!motherChild) {
      throw new Error("Mother child record not found");
    }

    return motherChild;
  } catch (error) {
    throw error;
  }
};

/**
 * Get mother child statistics
 * @returns {Promise<Object>} Mother child statistics
 */
export const getMotherChildStats = async () => {
  try {
    const stats = await MotherChild.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgMotherAge: { $avg: "$ageOfMother" },
          avgChildAge: { $avg: "$ageOfChild" },
          completeImmunization: {
            $sum: {
              $cond: [{ $eq: ["$immunizationStatus", "Complete"] }, 1, 0],
            },
          },
          normalNutrition: {
            $sum: { $cond: [{ $eq: ["$nutritionalStatus", "Normal"] }, 1, 0] },
          },
          malnourished: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$nutritionalStatus",
                    ["Malnourished", "Severely Malnourished"],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          avgMotherAge: { $round: ["$avgMotherAge", 1] },
          avgChildAge: { $round: ["$avgChildAge", 1] },
          completeImmunization: 1,
          normalNutrition: 1,
          malnourished: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalRecords: 0,
        avgMotherAge: 0,
        avgChildAge: 0,
        completeImmunization: 0,
        normalNutrition: 0,
        malnourished: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};
