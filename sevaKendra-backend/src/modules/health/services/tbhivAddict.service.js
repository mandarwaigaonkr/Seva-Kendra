import TBHIVAddict from "../models/tbhivAddict.model.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

/**
 * Create a new TB/HIV/Addict record
 * @param {Object} tbhivAddictData - TB/HIV/Addict data
 * @param {string} userId - ID of the user creating the TB/HIV/Addict record
 * @returns {Promise<Object>} Created TB/HIV/Addict record
 */
export const createTBHIVAddict = async (tbhivAddictData, userId) => {
  try {
    const tbhivAddict = new TBHIVAddict({
      ...tbhivAddictData,
      createdBy: userId,
    });
    return await tbhivAddict.save();
  } catch (error) {
    throw error;
  }
};

/**
 * Get all TB/HIV/Addict records with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} TB/HIV/Addict records with pagination info
 */
export const getAllTBHIVAddict = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      gender = "",
      wardNo = "",
      habitation = "",
      conditionType = "",
      tbTreatmentStatus = "",
      hivStatus = "",
      artStatus = "",
      rehabilitationStatus = "",
      treatmentOutcome = "",
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
        { substanceType: { $regex: escapeRegex(search), $options: "i" } },
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

    if (conditionType && conditionType !== "all") {
      filter.conditionType = conditionType;
    }

    if (tbTreatmentStatus && tbTreatmentStatus !== "all") {
      filter.tbTreatmentStatus = tbTreatmentStatus;
    }

    if (hivStatus && hivStatus !== "all") {
      filter.hivStatus = hivStatus;
    }

    if (artStatus && artStatus !== "all") {
      filter.artStatus = artStatus;
    }

    if (rehabilitationStatus && rehabilitationStatus !== "all") {
      filter.rehabilitationStatus = rehabilitationStatus;
    }

    if (treatmentOutcome && treatmentOutcome !== "all") {
      filter.treatmentOutcome = treatmentOutcome;
    }

    // Create pagination query
    const paginationOptions = getPaginationOptions({ page, limit });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const tbhivAddict = await TBHIVAddict.find(filter)
      .sort(sort)
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    const total = await TBHIVAddict.countDocuments(filter);

    return {
      tbhivAddict,
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
 * Get TB/HIV/Addict record by ID
 * @param {string} id - TB/HIV/Addict record ID
 * @returns {Promise<Object>} TB/HIV/Addict record
 */
export const getTBHIVAddictById = async (id) => {
  try {
    const tbhivAddict = await TBHIVAddict.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!tbhivAddict) {
      throw new Error("TB/HIV/Addict record not found");
    }

    return tbhivAddict;
  } catch (error) {
    throw error;
  }
};

/**
 * Update TB/HIV/Addict record by ID
 * @param {string} id - TB/HIV/Addict record ID
 * @param {Object} updateData - Update data
 * @param {string} userId - ID of the user updating the TB/HIV/Addict record
 * @returns {Promise<Object>} Updated TB/HIV/Addict record
 */
export const updateTBHIVAddict = async (id, updateData, userId) => {
  try {
    const tbhivAddict = await TBHIVAddict.findByIdAndUpdate(
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

    if (!tbhivAddict) {
      throw new Error("TB/HIV/Addict record not found");
    }

    return tbhivAddict;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete TB/HIV/Addict record by ID
 * @param {string} id - TB/HIV/Addict record ID
 * @returns {Promise<Object>} Deleted TB/HIV/Addict record
 */
export const deleteTBHIVAddict = async (id) => {
  try {
    const tbhivAddict = await TBHIVAddict.findByIdAndDelete(id);

    if (!tbhivAddict) {
      throw new Error("TB/HIV/Addict record not found");
    }

    return tbhivAddict;
  } catch (error) {
    throw error;
  }
};

/**
 * Get TB/HIV/Addict statistics
 * @returns {Promise<Object>} TB/HIV/Addict statistics
 */
export const getTBHIVAddictStats = async () => {
  try {
    const stats = await TBHIVAddict.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgAge: { $avg: "$age" },
          maleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] },
          },
          femaleCount: {
            $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] },
          },
          tbCases: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: "$conditionType",
                    regex: /TB/,
                  },
                },
                1,
                0,
              ],
            },
          },
          hivCases: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: "$conditionType",
                    regex: /HIV/,
                  },
                },
                1,
                0,
              ],
            },
          },
          addictionCases: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: "$conditionType",
                    regex: /Addiction/,
                  },
                },
                1,
                0,
              ],
            },
          },
          tbTreatmentCompleted: {
            $sum: {
              $cond: [
                {
                  $in: ["$tbTreatmentStatus", ["Completed"]],
                },
                1,
                0,
              ],
            },
          },
          hivPositive: {
            $sum: { $cond: [{ $eq: ["$hivStatus", "Positive"] }, 1, 0] },
          },
          onART: {
            $sum: { $cond: [{ $eq: ["$artStatus", "In Progress"] }, 1, 0] },
          },
          rehabilitationCompleted: {
            $sum: {
              $cond: [{ $eq: ["$rehabilitationStatus", "Completed"] }, 1, 0],
            },
          },
          cured: {
            $sum: {
              $cond: [
                {
                  $in: ["$treatmentOutcome", ["Cured", "Treatment Completed"]],
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
          avgAge: { $round: ["$avgAge", 1] },
          maleCount: 1,
          femaleCount: 1,
          tbCases: 1,
          hivCases: 1,
          addictionCases: 1,
          tbTreatmentCompleted: 1,
          hivPositive: 1,
          onART: 1,
          rehabilitationCompleted: 1,
          cured: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalRecords: 0,
        avgAge: 0,
        maleCount: 0,
        femaleCount: 0,
        tbCases: 0,
        hivCases: 0,
        addictionCases: 0,
        tbTreatmentCompleted: 0,
        hivPositive: 0,
        onART: 0,
        rehabilitationCompleted: 0,
        cured: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};
