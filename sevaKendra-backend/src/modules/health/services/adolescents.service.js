import Adolescents from "../models/adolescents.model.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

/**
 * Create a new adolescent record
 * @param {Object} adolescentData - Adolescent data
 * @param {string} userId - ID of the user creating the adolescent record
 * @returns {Promise<Object>} Created adolescent record
 */
export const createAdolescent = async (adolescentData, userId) => {
  try {
    const adolescent = new Adolescents({
      ...adolescentData,
      createdBy: userId,
    });
    return await adolescent.save();
  } catch (error) {
    throw error;
  }
};

/**
 * Get all adolescent records with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Adolescent records with pagination info
 */
export const getAllAdolescents = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      gender = "",
      wardNo = "",
      habitation = "",
      educationStatus = "",
      nutritionalStatus = "",
      mentalHealthScreening = "",
      substanceUse = "",
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
        { schoolName: { $regex: escapeRegex(search), $options: "i" } },
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

    if (educationStatus && educationStatus !== "all") {
      filter.educationStatus = educationStatus;
    }

    if (nutritionalStatus && nutritionalStatus !== "all") {
      filter.nutritionalStatus = nutritionalStatus;
    }

    if (mentalHealthScreening && mentalHealthScreening !== "all") {
      filter.mentalHealthScreening = mentalHealthScreening;
    }

    if (substanceUse && substanceUse !== "all") {
      filter.substanceUse = substanceUse;
    }

    // Create pagination query
    const paginationOptions = getPaginationOptions({ page, limit });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const adolescents = await Adolescents.find(filter)
      .sort(sort)
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    const total = await Adolescents.countDocuments(filter);

    return {
      adolescents,
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
 * Get adolescent record by ID
 * @param {string} id - Adolescent record ID
 * @returns {Promise<Object>} Adolescent record
 */
export const getAdolescentById = async (id) => {
  try {
    const adolescent = await Adolescents.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!adolescent) {
      throw new Error("Adolescent record not found");
    }

    return adolescent;
  } catch (error) {
    throw error;
  }
};

/**
 * Update adolescent record by ID
 * @param {string} id - Adolescent record ID
 * @param {Object} updateData - Update data
 * @param {string} userId - ID of the user updating the adolescent record
 * @returns {Promise<Object>} Updated adolescent record
 */
export const updateAdolescent = async (id, updateData, userId) => {
  try {
    const adolescent = await Adolescents.findByIdAndUpdate(
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

    if (!adolescent) {
      throw new Error("Adolescent record not found");
    }

    return adolescent;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete adolescent record by ID
 * @param {string} id - Adolescent record ID
 * @returns {Promise<Object>} Deleted adolescent record
 */
export const deleteAdolescent = async (id) => {
  try {
    const adolescent = await Adolescents.findByIdAndDelete(id);

    if (!adolescent) {
      throw new Error("Adolescent record not found");
    }

    return adolescent;
  } catch (error) {
    throw error;
  }
};

/**
 * Get adolescent statistics
 * @returns {Promise<Object>} Adolescent statistics
 */
export const getAdolescentStats = async () => {
  try {
    const stats = await Adolescents.aggregate([
      {
        $group: {
          _id: null,
          totalAdolescents: { $sum: 1 },
          avgAge: { $avg: "$age" },
          avgBMI: { $avg: "$bmi" },
          maleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] },
          },
          femaleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] },
          },
          inSchool: {
            $sum: { $cond: [{ $eq: ["$educationStatus", "In School"] }, 1, 0] },
          },
          droppedOut: {
            $sum: {
              $cond: [{ $eq: ["$educationStatus", "Dropped Out"] }, 1, 0],
            },
          },
          normalNutrition: {
            $sum: { $cond: [{ $eq: ["$nutritionalStatus", "Normal"] }, 1, 0] },
          },
          underweight: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$nutritionalStatus",
                    ["Underweight", "Severely Underweight"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          mentalHealthAtRisk: {
            $sum: {
              $cond: [
                {
                  $in: ["$mentalHealthScreening", ["At Risk", "Needs Support"]],
                },
                1,
                0,
              ],
            },
          },
          substanceUsers: {
            $sum: {
              $cond: [{ $ne: ["$substanceUse", "None"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalAdolescents: 1,
          avgAge: { $round: ["$avgAge", 1] },
          avgBMI: { $round: ["$avgBMI", 1] },
          maleCount: 1,
          femaleCount: 1,
          inSchool: 1,
          droppedOut: 1,
          normalNutrition: 1,
          underweight: 1,
          mentalHealthAtRisk: 1,
          substanceUsers: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalAdolescents: 0,
        avgAge: 0,
        avgBMI: 0,
        maleCount: 0,
        femaleCount: 0,
        inSchool: 0,
        droppedOut: 0,
        normalNutrition: 0,
        underweight: 0,
        mentalHealthAtRisk: 0,
        substanceUsers: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};
