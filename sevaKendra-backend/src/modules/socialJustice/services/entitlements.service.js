import Entitlements from "../models/entitlements.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class EntitlementsService {
  /**
   * Create a new Entitlements record
   * @param {Object} entitlementsData - The entitlements data
   * @param {String} userId - The ID of the user creating the record
   * @returns {Promise<Object>} The created entitlements record
   */
  async createEntitlements(entitlementsData, userId) {
    try {
      // Clean up empty string values in nested objects
      if (entitlementsData.idProofAndDomicile?.typeOfDocument === "") {
        delete entitlementsData.idProofAndDomicile.typeOfDocument;
      }
      
      const entitlements = new Entitlements({
        ...entitlementsData,
        createdBy: userId,
      });
      return await entitlements.save();
    } catch (error) {
      throw new APIError(`Error creating entitlements: ${error.message}`, 400);
    }
  }

  /**
   * Get all Entitlements records with pagination and filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated entitlements records
   */
  async getAllEntitlements(filters = {}, options = {}) {
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
      if (filters.status) query.status = filters.status;
      if (filters.projectResponsible)
        query.projectResponsible = new RegExp(escapeRegex(filters.projectResponsible), "i");
      if (filters.entitlementType) {
        // The ID-proof enum spells it "Aadhar Card"; people type "Aadhaar". Match both.
        const pattern = new RegExp(escapeRegex(filters.entitlementType).replace(/aadhaa?r/i, "aadhaa?r"), "i");
        query.$or = [
          { "schemes.eligibleSchemes": pattern },
          { "idProofAndDomicile.typeOfDocument": pattern }
        ];
      }

      // Date range filters (on dateOfReporting since dateOfApplication doesn't exist)
      if (filters.dateFrom || filters.dateTo) {
        query.dateOfReporting = {};
        if (filters.dateFrom)
          query.dateOfReporting.$gte = new Date(filters.dateFrom);
        if (filters.dateTo)
          query.dateOfReporting.$lte = new Date(filters.dateTo);
      }

      // Apply search
      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        const searchQuery = {
          $or: [
            { name: searchRegex },
            { headOfHousehold: searchRegex },
            { habitation: searchRegex },
            { contactNo: searchRegex },
            { idCode: searchRegex },
            { householdCode: searchRegex },
            { projectResponsible: searchRegex },
            { remarks: searchRegex },
            { "schemes.eligibleSchemes": searchRegex },
            { "idProofAndDomicile.typeOfDocument": searchRegex }
          ],
        };
        // Merge with existing $or if any
        if (query.$or) {
          query = { $and: [query, searchQuery] };
        } else {
          query = { ...query, ...searchQuery };
        }
      }

      // Execute query with pagination
      const entitlements = await Entitlements.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      const total = await Entitlements.countDocuments(query);

      return {
        data: entitlements,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          recordsPerPage: limit,
        },
      };
    } catch (error) {
      throw new APIError(`Error fetching entitlements: ${error.message}`, 500);
    }
  }

  /**
   * Get a single Entitlements record by ID
   * @param {String} id - The ID of the entitlements record
   * @returns {Promise<Object>} The entitlements record
   */
  async getEntitlementsById(id) {
    try {
      const entitlements = await Entitlements.findById(id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!entitlements) {
        throw new APIError("Entitlements record not found", 404);
      }

      return entitlements;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error fetching entitlements: ${error.message}`, 500);
    }
  }

  /**
   * Update an Entitlements record
   * @param {String} id - The ID of the entitlements record
   * @param {Object} updateData - The data to update
   * @param {String} userId - The ID of the user updating the record
   * @returns {Promise<Object>} The updated entitlements record
   */
  async updateEntitlements(id, updateData, userId) {
    try {
      const entitlements = await Entitlements.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: userId },
        { new: true, runValidators: true }
      )
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!entitlements) {
        throw new APIError("Entitlements record not found", 404);
      }

      return entitlements;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error updating entitlements: ${error.message}`, 400);
    }
  }

  /**
   * Delete an Entitlements record
   * @param {String} id - The ID of the entitlements record
   * @returns {Promise<Object>} Success message
   */
  async deleteEntitlements(id) {
    try {
      const entitlements = await Entitlements.findByIdAndDelete(id);

      if (!entitlements) {
        throw new APIError("Entitlements record not found", 404);
      }

      return { message: "Entitlements record deleted successfully" };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error deleting entitlements: ${error.message}`, 500);
    }
  }

  /**
   * Get Entitlements statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getEntitlementsStats() {
    try {
      return await Entitlements.getStats();
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching entitlements statistics: ${error.message}`
      );
    }
  }

  /**
   * Get Entitlements by ward
   * @param {String} wardNo - Ward number
   * @returns {Promise<Array>} Entitlements records for the ward
   */
  async getEntitlementsByWard(wardNo) {
    try {
      return await Entitlements.find({ wardNo })
        .populate("createdBy", "name")
        .sort({ beneficiaryName: 1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching entitlements by ward: ${error.message}`
      );
    }
  }

  /**
   * Get Entitlements by habitation
   * @param {String} habitation - Habitation name
   * @returns {Promise<Array>} Entitlements records for the habitation
   */
  async getEntitlementsByHabitation(habitation) {
    try {
      return await Entitlements.find({
        habitation: new RegExp(escapeRegex(habitation), "i"),
      })
        .populate("createdBy", "name")
        .sort({ beneficiaryName: 1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching entitlements by habitation: ${error.message}`
      );
    }
  }

  /**
   * Get Entitlements by application status
   * @param {String} applicationStatus - Application status
   * @returns {Promise<Array>} Entitlements records for the status
   */
  async getEntitlementsByStatus(status) {
    try {
      return await Entitlements.find({ status })
        .populate("createdBy", "name")
        .sort({ dateOfReporting: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching entitlements by status: ${error.message}`
      );
    }
  }

  /**
   * Get Entitlements by ID proof type
   * @param {String} idProofType - ID proof type
   * @returns {Promise<Array>} Entitlements records for the ID proof type
   */
  async getEntitlementsByIdProofType(idProofType) {
    try {
      return await Entitlements.find({ idProofType })
        .populate("createdBy", "name")
        .sort({ beneficiaryName: 1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching entitlements by ID proof type: ${error.message}`
      );
    }
  }

  /**
   * Add eligible scheme to entitlements record
   * @param {String} id - The ID of the entitlements record
   * @param {Object} schemeData - Eligible scheme data
   * @param {String} userId - The ID of the user adding the scheme
   * @returns {Promise<Object>} The updated entitlements record
   */
  async addEligibleScheme(id, schemeData, userId) {
    try {
      const entitlements = await Entitlements.findById(id);

      if (!entitlements) {
        throw new APIError("Entitlements record not found", 404);
      }

      entitlements.eligibleSchemes.push(schemeData);
      entitlements.updatedBy = userId;

      return await entitlements.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error adding eligible scheme: ${error.message}`, 400);
    }
  }

  /**
   * Update eligible scheme status
   * @param {String} id - The ID of the entitlements record
   * @param {String} schemeId - The ID of the scheme to update
   * @param {String} status - New status
   * @param {String} userId - The ID of the user updating the status
   * @returns {Promise<Object>} The updated entitlements record
   */
  async updateSchemeStatus(id, schemeId, status, userId) {
    try {
      const entitlements = await Entitlements.findById(id);

      if (!entitlements) {
        throw new APIError("Entitlements record not found", 404);
      }

      const scheme = entitlements.eligibleSchemes.id(schemeId);
      if (!scheme) {
        throw new APIError("Scheme not found", 404);
      }

      scheme.applicationStatus = status;
      entitlements.updatedBy = userId;

      return await entitlements.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error updating scheme status: ${error.message}`, 400);
    }
  }

  /**
   * Add progress report
   * @param {String} id - The ID of the entitlements record
   * @param {Object} progressData - Progress report data
   * @param {String} userId - The ID of the user adding the progress
   * @returns {Promise<Object>} The updated entitlements record
   */
  async addProgressReport(id, progressData, userId) {
    try {
      const entitlements = await Entitlements.findById(id);

      if (!entitlements) {
        throw new APIError("Entitlements record not found", 404);
      }

      entitlements.progressReports.push(progressData);
      entitlements.updatedBy = userId;

      return await entitlements.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Error adding progress report: ${error.message}`, 400);
    }
  }

  /**
   * Update progress report
   * @param {String} id - The ID of the entitlements record
   * @param {String} reportId - The ID of the progress report to update
   * @param {Object} progressData - Updated progress report data
   * @param {String} userId - The ID of the user updating the progress
   * @returns {Promise<Object>} The updated entitlements record
   */
  async updateProgressReport(id, reportId, progressData, userId) {
    try {
      const entitlements = await Entitlements.findById(id);

      if (!entitlements) {
        throw new APIError("Entitlements record not found", 404);
      }

      const report = entitlements.progressReports.id(reportId);
      if (!report) {
        throw new APIError("Progress report not found", 404);
      }

      Object.assign(report, progressData);
      entitlements.updatedBy = userId;

      return await entitlements.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error updating progress report: ${error.message}`
      );
    }
  }

  /**
   * Get entitlements summary by scheme
   * @param {String} schemeName - Name of the scheme
   * @returns {Promise<Object>} Scheme summary
   */
  async getEntitlementsByScheme(schemeName) {
    try {
      const entitlements = await Entitlements.find({
        "eligibleSchemes.schemeName": new RegExp(escapeRegex(schemeName), "i"),
      }).populate("createdBy", "name");

      const summary = {
        totalBeneficiaries: entitlements.length,
        statusBreakdown: {},
        applications: [],
      };

      entitlements.forEach((entitlement) => {
        const schemes = entitlement.eligibleSchemes.filter((scheme) =>
          scheme.schemeName.toLowerCase().includes(schemeName.toLowerCase())
        );

        schemes.forEach((scheme) => {
          const status = scheme.applicationStatus || "Not Applied";
          summary.statusBreakdown[status] =
            (summary.statusBreakdown[status] || 0) + 1;

          summary.applications.push({
            beneficiaryName: entitlement.beneficiaryName,
            contactNo: entitlement.contactNo,
            wardNo: entitlement.wardNo,
            habitation: entitlement.habitation,
            schemeName: scheme.schemeName,
            applicationStatus: scheme.applicationStatus,
            dateApplied: scheme.dateApplied,
            amountReceived: scheme.amountReceived,
          });
        });
      });

      return summary;
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching entitlements by scheme: ${error.message}`
      );
    }
  }
}

export default new EntitlementsService();

