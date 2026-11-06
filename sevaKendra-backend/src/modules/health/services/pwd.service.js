import PWD from "../models/pwd.model.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

/**
 * Create a new PWD record
 * @param {Object} pwdData - PWD data
 * @param {string} userId - ID of the user creating the PWD record
 * @returns {Promise<Object>} Created PWD record
 */
export const createPWD = async (pwdData, userId) => {
  try {
    const pwd = new PWD({
      ...pwdData,
      createdBy: userId,
    });
    return await pwd.save();
  } catch (error) {
    throw error;
  }
};

/**
 * Get all PWD records with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} PWD records with pagination info
 */
export const getAllPWD = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      gender = "",
      wardNo = "",
      habitation = "",
      typeOfDisability = "",
      disabilityCertificate = "",
      employmentStatus = "",
      pensionStatus = "",
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
        { typeOfDisability: { $regex: escapeRegex(search), $options: "i" } },
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

    if (typeOfDisability && typeOfDisability !== "all") {
      filter.typeOfDisability = typeOfDisability;
    }

    if (disabilityCertificate && disabilityCertificate !== "all") {
      filter.disabilityCertificate = disabilityCertificate;
    }

    if (employmentStatus && employmentStatus !== "all") {
      filter.employmentStatus = employmentStatus;
    }

    if (pensionStatus && pensionStatus !== "all") {
      filter.pensionStatus = pensionStatus;
    }

    // Create pagination query
    const paginationOptions = getPaginationOptions({ page, limit });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const pwd = await PWD.find(filter)
      .sort(sort)
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    const total = await PWD.countDocuments(filter);

    return {
      pwd,
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
 * Get PWD record by ID
 * @param {string} id - PWD record ID
 * @returns {Promise<Object>} PWD record
 */
export const getPWDById = async (id) => {
  try {
    const pwd = await PWD.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!pwd) {
      throw new Error("PWD record not found");
    }

    return pwd;
  } catch (error) {
    throw error;
  }
};

/**
 * Update PWD record by ID
 * @param {string} id - PWD record ID
 * @param {Object} updateData - Update data
 * @param {string} userId - ID of the user updating the PWD record
 * @returns {Promise<Object>} Updated PWD record
 */
export const updatePWD = async (id, updateData, userId) => {
  try {
    const pwd = await PWD.findByIdAndUpdate(
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

    if (!pwd) {
      throw new Error("PWD record not found");
    }

    return pwd;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete PWD record by ID
 * @param {string} id - PWD record ID
 * @returns {Promise<Object>} Deleted PWD record
 */
export const deletePWD = async (id) => {
  try {
    const pwd = await PWD.findByIdAndDelete(id);

    if (!pwd) {
      throw new Error("PWD record not found");
    }

    return pwd;
  } catch (error) {
    throw error;
  }
};

/**
 * Get PWD statistics
 * @returns {Promise<Object>} PWD statistics
 */
export const getPWDStats = async () => {
  try {
    const stats = await PWD.aggregate([
      {
        $group: {
          _id: null,
          totalPWD: { $sum: 1 },
          avgAge: { $avg: "$age" },
          avgDisabilityPercentage: { $avg: "$percentageOfDisability" },
          maleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] },
          },
          femaleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] },
          },
          withCertificate: {
            $sum: {
              $cond: [{ $eq: ["$disabilityCertificate", "Available"] }, 1, 0],
            },
          },
          employed: {
            $sum: {
              $cond: [
                {
                  $in: ["$employmentStatus", ["Employed", "Self-Employed"]],
                },
                1,
                0,
              ],
            },
          },
          receivingPension: {
            $sum: { $cond: [{ $eq: ["$pensionStatus", "Receiving"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalPWD: 1,
          avgAge: { $round: ["$avgAge", 1] },
          avgDisabilityPercentage: { $round: ["$avgDisabilityPercentage", 1] },
          maleCount: 1,
          femaleCount: 1,
          withCertificate: 1,
          withoutCertificate: { $subtract: ["$totalPWD", "$withCertificate"] },
          employed: 1,
          unemployed: { $subtract: ["$totalPWD", "$employed"] },
          receivingPension: 1,
          notReceivingPension: {
            $subtract: ["$totalPWD", "$receivingPension"],
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalPWD: 0,
        avgAge: 0,
        avgDisabilityPercentage: 0,
        maleCount: 0,
        femaleCount: 0,
        withCertificate: 0,
        withoutCertificate: 0,
        employed: 0,
        unemployed: 0,
        receivingPension: 0,
        notReceivingPension: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};
