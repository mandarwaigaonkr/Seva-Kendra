import CBUCBODetails from "../models/cbucboDetails.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class CBUCBODetailsService {
  /**
   * Create a new CBUCBO Details record
   * @param {Object} cbucboDetailsData - The CBUCBO details data
   * @param {String} userId - The ID of the user creating the record
   * @returns {Promise<Object>} The created CBUCBO details record
   */
  async createCBUCBODetails(cbucboDetailsData, userId) {
    try {
      const cbucboDetails = new CBUCBODetails({
        ...cbucboDetailsData,
        createdBy: userId,
      });
      return await cbucboDetails.save();
    } catch (error) {
      throw new APIError(
        `Error creating CBUCBO details: ${error.message}`,
        400
      );
    }
  }

  /**
   * Get all CBUCBO Details records with pagination and filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated CBUCBO details records
   */
  async getAllCBUCBODetails(filters = {}, options = {}) {
    try {
      const { limit, skip } = getPaginationOptions(options);

      // Extract pagination and sorting options
      const page = Number(options.page) || 1;
      const sortBy = options.sortBy || "createdAt";
      const sortOrder = options.sortOrder === "asc" ? 1 : -1;
      const search = options.search || "";

      // Build query
      let query = {};

      // Apply filters
      if (filters.wardNo) query.wardNo = filters.wardNo;
      if (filters.habitation)
        query.habitation = new RegExp(escapeRegex(filters.habitation), "i");
      if (filters.groupType) query.groupType = filters.groupType;
      if (filters.status) query.status = filters.status;
      if (filters.projectResponsible)
        query.projectResponsible = new RegExp(escapeRegex(filters.projectResponsible), "i");

      // Date range filters
      if (filters.dateFrom || filters.dateTo) {
        query.dateOfFormation = {};
        if (filters.dateFrom)
          query.dateOfFormation.$gte = new Date(filters.dateFrom);
        if (filters.dateTo)
          query.dateOfFormation.$lte = new Date(filters.dateTo);
      }

      // Apply search
      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        const searchQuery = {
          $or: [
            { groupId: searchRegex },
            { groupName: searchRegex },
            { groupType: searchRegex },
            { habitation: searchRegex },
            { projectResponsible: searchRegex },
            { "president.name": searchRegex },
            { "secretary.name": searchRegex },
            { remarks: searchRegex },
          ],
        };
        query = { ...query, ...searchQuery };
      }

      // Execute query with pagination
      const cbucboDetails = await CBUCBODetails.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      const total = await CBUCBODetails.countDocuments(query);

      return {
        data: cbucboDetails,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          recordsPerPage: limit,
        },
      };
    } catch (error) {
      throw new APIError(
        `Error fetching CBUCBO details: ${error.message}`,
        500
      );
    }
  }

  /**
   * Get a single CBUCBO Details record by ID
   * @param {String} id - The ID of the CBUCBO details record
   * @returns {Promise<Object>} The CBUCBO details record
   */
  async getCBUCBODetailsById(id) {
    try {
      const cbucboDetails = await CBUCBODetails.findById(id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!cbucboDetails) {
        throw new APIError("CBUCBO details not found", 404);
      }

      return cbucboDetails;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        `Error fetching CBUCBO details: ${error.message}`,
        500
      );
    }
  }

  /**
   * Update a CBUCBO Details record
   * @param {String} id - The ID of the CBUCBO details record
   * @param {Object} updateData - The data to update
   * @param {String} userId - The ID of the user updating the record
   * @returns {Promise<Object>} The updated CBUCBO details record
   */
  async updateCBUCBODetails(id, updateData, userId) {
    try {
      const cbucboDetails = await CBUCBODetails.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: userId },
        { new: true, runValidators: true }
      )
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!cbucboDetails) {
        throw new APIError("CBUCBO details not found", 404);
      }

      return cbucboDetails;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error updating CBUCBO details: ${error.message}`, 400);
    }
  }

  /**
   * Delete a CBUCBO Details record
   * @param {String} id - The ID of the CBUCBO details record
   * @returns {Promise<Object>} Success message
   */
  async deleteCBUCBODetails(id) {
    try {
      const cbucboDetails = await CBUCBODetails.findByIdAndDelete(id);

      if (!cbucboDetails) {
        throw new APIError("CBUCBO details not found", 404);
      }

      return { message: "CBUCBO details deleted successfully" };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error deleting CBUCBO details: ${error.message}`, 500);
    }
  }

  /**
   * Get CBUCBO Details statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getCBUCBODetailsStats() {
    try {
      return await CBUCBODetails.getStats();
    } catch (error) {
      throw new APIError(`Error fetching CBUCBO details statistics: ${error.message}`, 500);
    }
  }

  /**
   * Get CBUCBO Details by ward
   * @param {String} wardNo - Ward number
   * @returns {Promise<Array>} CBUCBO details records for the ward
   */
  async getCBUCBODetailsByWard(wardNo) {
    try {
      return await CBUCBODetails.find({ wardNo })
        .populate("createdBy", "name")
        .sort({ groupName: 1 });
    } catch (error) {
      throw new APIError(`Error fetching CBUCBO details by ward: ${error.message}`, 500);
    }
  }

  /**
   * Get CBUCBO Details by habitation
   * @param {String} habitation - Habitation name
   * @returns {Promise<Array>} CBUCBO details records for the habitation
   */
  async getCBUCBODetailsByHabitation(habitation) {
    try {
      return await CBUCBODetails.find({
        habitation: new RegExp(escapeRegex(habitation), "i"),
      })
        .populate("createdBy", "name")
        .sort({ groupName: 1 });
    } catch (error) {
      throw new APIError(`Error fetching CBUCBO details by habitation: ${error.message}`, 500);
    }
  }

  /**
   * Get CBUCBO Details by group type
   * @param {String} groupType - Group type
   * @returns {Promise<Array>} CBUCBO details records for the group type
   */
  async getCBUCBODetailsByGroupType(groupType) {
    try {
      return await CBUCBODetails.find({ groupType })
        .populate("createdBy", "name")
        .sort({ groupName: 1 });
    } catch (error) {
      throw new APIError(`Error fetching CBUCBO details by group type: ${error.message}`, 500);
    }
  }

  /**
   * Get CBUCBO Details by status
   * @param {String} status - Status
   * @returns {Promise<Array>} CBUCBO details records for the status
   */
  async getCBUCBODetailsByStatus(status) {
    try {
      return await CBUCBODetails.find({ status })
        .populate("createdBy", "name")
        .sort({ groupName: 1 });
    } catch (error) {
      throw new APIError(`Error fetching CBUCBO details by status: ${error.message}`, 500);
    }
  }

  /**
   * Update member details for a CBUCBO group
   * @param {String} id - The ID of the CBUCBO details record
   * @param {Array} memberDetails - Updated member details
   * @param {String} userId - The ID of the user updating the record
   * @returns {Promise<Object>} The updated CBUCBO details record
   */
  async updateMemberDetails(id, memberDetails, userId) {
    try {
      const cbucboDetails = await CBUCBODetails.findByIdAndUpdate(
        id,
        {
          memberDetails,
          totalMembers: memberDetails.length,
          updatedBy: userId,
        },
        { new: true, runValidators: true }
      );

      if (!cbucboDetails) {
        throw new APIError("CBUCBO details not found", 404);
      }

      return cbucboDetails;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error updating member details: ${error.message}`, 400);
    }
  }

  /**
   * Add capacity building activity
   * @param {String} id - The ID of the CBUCBO details record
   * @param {Object} activityData - Capacity building activity data
   * @param {String} userId - The ID of the user adding the activity
   * @returns {Promise<Object>} The updated CBUCBO details record
   */
  async addCapacityBuildingActivity(id, activityData, userId) {
    try {
      const cbucboDetails = await CBUCBODetails.findById(id);

      if (!cbucboDetails) {
        throw new APIError("CBUCBO details not found", 404);
      }

      cbucboDetails.capacityBuildingActivities.push(activityData);
      cbucboDetails.updatedBy = userId;

      return await cbucboDetails.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error adding capacity building activity: ${error.message}`, 400);
    }
  }

  /**
   * Update progress report
   * @param {String} id - The ID of the CBUCBO details record
   * @param {Object} progressData - Progress report data
   * @param {String} userId - The ID of the user updating the progress
   * @returns {Promise<Object>} The updated CBUCBO details record
   */
  async updateProgressReport(id, progressData, userId) {
    try {
      const cbucboDetails = await CBUCBODetails.findByIdAndUpdate(
        id,
        {
          progressReport: progressData,
          updatedBy: userId,
        },
        { new: true, runValidators: true }
      );

      if (!cbucboDetails) {
        throw new APIError("CBUCBO details not found", 404);
      }

      return cbucboDetails;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error updating progress report: ${error.message}`, 400);
    }
  }
}

export default new CBUCBODetailsService();


