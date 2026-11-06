import LegalAidService from "../models/legalAidService.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class LegalAidServiceService {
  /**
   * Create a new Legal Aid Service record
   * @param {Object} legalAidData - The legal aid service data
   * @param {String} userId - The ID of the user creating the record
   * @returns {Promise<Object>} The created legal aid service record
   */
  async createLegalAidService(legalAidData, userId) {
    try {
      const legalAid = new LegalAidService({
        ...legalAidData,
        createdBy: userId,
      });
      return await legalAid.save();
    } catch (error) {
      throw new APIError(
        400,
        `Error creating legal aid service: ${error.message}`
      );
    }
  }

  /**
   * Get all Legal Aid Service records with pagination and filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated legal aid service records
   */
  async getAllLegalAidServices(filters = {}, options = {}) {
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
      if (filters.caseType) query.natureOfIssue = filters.caseType;
      if (filters.caseStatus) query.status = filters.caseStatus;
      if (filters.priorityLevel) query.priority = filters.priorityLevel;
      if (filters.projectResponsible)
        query.projectResponsible = new RegExp(escapeRegex(filters.projectResponsible), "i");

      // Date range filters
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
            { natureOfIssue: searchRegex },
            { actionPlan: searchRegex },
            { projectResponsible: searchRegex },
            { remarks: searchRegex },
          ],
        };
        query = { ...query, ...searchQuery };
      }

      // Execute query with pagination
      const legalAidServices = await LegalAidService.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      const total = await LegalAidService.countDocuments(query);

      return {
        data: legalAidServices,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          recordsPerPage: limit,
        },
      };
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching legal aid services: ${error.message}`
      );
    }
  }

  /**
   * Get a single Legal Aid Service record by ID
   * @param {String} id - The ID of the legal aid service record
   * @returns {Promise<Object>} The legal aid service record
   */
  async getLegalAidServiceById(id) {
    try {
      const legalAidService = await LegalAidService.findById(id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!legalAidService) {
        throw new APIError(404, "Legal aid service record not found");
      }

      return legalAidService;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        500,
        `Error fetching legal aid service: ${error.message}`
      );
    }
  }

  /**
   * Update a Legal Aid Service record
   * @param {String} id - The ID of the legal aid service record
   * @param {Object} updateData - The data to update
   * @param {String} userId - The ID of the user updating the record
   * @returns {Promise<Object>} The updated legal aid service record
   */
  async updateLegalAidService(id, updateData, userId) {
    try {
      const legalAidService = await LegalAidService.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: userId },
        { new: true, runValidators: true }
      )
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!legalAidService) {
        throw new APIError(404, "Legal aid service record not found");
      }

      return legalAidService;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error updating legal aid service: ${error.message}`
      );
    }
  }

  /**
   * Delete a Legal Aid Service record
   * @param {String} id - The ID of the legal aid service record
   * @returns {Promise<Object>} Success message
   */
  async deleteLegalAidService(id) {
    try {
      const legalAidService = await LegalAidService.findByIdAndDelete(id);

      if (!legalAidService) {
        throw new APIError(404, "Legal aid service record not found");
      }

      return { message: "Legal aid service record deleted successfully" };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        500,
        `Error deleting legal aid service: ${error.message}`
      );
    }
  }

  /**
   * Get Legal Aid Service statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getLegalAidServiceStats() {
    try {
      return await LegalAidService.getStats();
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching legal aid service statistics: ${error.message}`
      );
    }
  }

  /**
   * Get Legal Aid Services by ward
   * @param {String} wardNo - Ward number
   * @returns {Promise<Array>} Legal aid service records for the ward
   */
  async getLegalAidServicesByWard(wardNo) {
    try {
      return await LegalAidService.find({ wardNo })
        .populate("createdBy", "name")
        .sort({ dateOfReporting: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching legal aid services by ward: ${error.message}`
      );
    }
  }

  /**
   * Get Legal Aid Services by habitation
   * @param {String} habitation - Habitation name
   * @returns {Promise<Array>} Legal aid service records for the habitation
   */
  async getLegalAidServicesByHabitation(habitation) {
    try {
      return await LegalAidService.find({
        habitation: new RegExp(escapeRegex(habitation), "i"),
      })
        .populate("createdBy", "name")
        .sort({ dateOfReporting: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching legal aid services by habitation: ${error.message}`
      );
    }
  }

  /**
   * Get Legal Aid Services by case type
   * @param {String} caseType - Case type
   * @returns {Promise<Array>} Legal aid service records for the case type
   */
  async getLegalAidServicesByCaseType(caseType) {
    try {
      return await LegalAidService.find({ natureOfIssue: caseType })
        .populate("createdBy", "name")
        .sort({ dateOfReporting: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching legal aid services by case type: ${error.message}`
      );
    }
  }

  /**
   * Get Legal Aid Services by case status
   * @param {String} caseStatus - Case status
   * @returns {Promise<Array>} Legal aid service records for the case status
   */
  async getLegalAidServicesByCaseStatus(caseStatus) {
    try {
      return await LegalAidService.find({ status: caseStatus })
        .populate("createdBy", "name")
        .sort({ dateOfReporting: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching legal aid services by case status: ${error.message}`
      );
    }
  }

  /**
   * Get Legal Aid Services by priority level
   * @param {String} priorityLevel - Priority level
   * @returns {Promise<Array>} Legal aid service records for the priority level
   */
  async getLegalAidServicesByPriority(priorityLevel) {
    try {
      return await LegalAidService.find({ priority: priorityLevel })
        .populate("createdBy", "name")
        .sort({ dateOfReporting: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching legal aid services by priority: ${error.message}`
      );
    }
  }

  /**
   * Add intervention step to legal aid case
   * @param {String} id - The ID of the legal aid service record
   * @param {Object} interventionData - Intervention step data
   * @param {String} userId - The ID of the user adding the intervention
   * @returns {Promise<Object>} The updated legal aid service record
   */
  async addInterventionStep(id, interventionData, userId) {
    try {
      const legalAidService = await LegalAidService.findById(id);

      if (!legalAidService) {
        throw new APIError(404, "Legal aid service record not found");
      }

      legalAidService.interventionSteps.push(interventionData);
      legalAidService.updatedBy = userId;

      return await legalAidService.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error adding intervention step: ${error.message}`
      );
    }
  }

  /**
   * Update intervention step
   * @param {String} id - The ID of the legal aid service record
   * @param {String} stepId - The ID of the intervention step to update
   * @param {Object} interventionData - Updated intervention step data
   * @param {String} userId - The ID of the user updating the intervention
   * @returns {Promise<Object>} The updated legal aid service record
   */
  async updateInterventionStep(id, stepId, interventionData, userId) {
    try {
      const legalAidService = await LegalAidService.findById(id);

      if (!legalAidService) {
        throw new APIError(404, "Legal aid service record not found");
      }

      const step = legalAidService.interventionSteps.id(stepId);
      if (!step) {
        throw new APIError(404, "Intervention step not found");
      }

      Object.assign(step, interventionData);
      legalAidService.updatedBy = userId;

      return await legalAidService.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error updating intervention step: ${error.message}`
      );
    }
  }

  /**
   * Update case status
   * @param {String} id - The ID of the legal aid service record
   * @param {String} caseStatus - New case status
   * @param {String} userId - The ID of the user updating the status
   * @returns {Promise<Object>} The updated legal aid service record
   */
  async updateCaseStatus(id, caseStatus, userId) {
    try {
      const legalAidService = await LegalAidService.findByIdAndUpdate(
        id,
        {
          status: caseStatus,
          updatedBy: userId,
        },
        { new: true, runValidators: true }
      );

      if (!legalAidService) {
        throw new APIError(404, "Legal aid service record not found");
      }

      return legalAidService;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(400, `Error updating case status: ${error.message}`);
    }
  }

  /**
   * Get cases requiring follow-up
   * @returns {Promise<Array>} Legal aid service records requiring follow-up
   */
  async getCasesRequiringFollowUp() {
    try {
      const today = new Date();
      return await LegalAidService.find({
        $or: [
          { followUpDate: { $lte: today } },
          { status: "In Progress" },
          { priority: "High" },
        ],
      })
        .populate("createdBy", "name")
        .sort({ followUpDate: 1, dateOfReporting: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching cases requiring follow-up: ${error.message}`
      );
    }
  }

  /**
   * Get case timeline
   * @param {String} id - The ID of the legal aid service record
   * @returns {Promise<Object>} Case timeline with all activities
   */
  async getCaseTimeline(id) {
    try {
      const legalAidService = await LegalAidService.findById(id)
        .populate("createdBy", "name")
        .populate("updatedBy", "name");

      if (!legalAidService) {
        throw new APIError(404, "Legal aid service record not found");
      }

      const timeline = [
        {
          date: legalAidService.dateOfReporting,
          event: "Case Registered",
          description: legalAidService.actionPlan,
          type: "registration",
        },
      ];

      if (legalAidService.followUpRequired && legalAidService.followUpDate) {
        timeline.push({
          date: legalAidService.followUpDate,
          event: "Follow-up Scheduled",
          description: legalAidService.remarks || "Follow-up required",
          type: "follow-up",
        });
      }

      // Sort timeline by date
      timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

      return {
        case: legalAidService,
        timeline,
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, `Error fetching case timeline: ${error.message}`);
    }
  }

  /**
   * Generate case report
   * @param {Object} filters - Filter criteria for the report
   * @returns {Promise<Object>} Case report data
   */
  async generateCaseReport(filters = {}) {
    try {
      let query = {};

      // Apply filters
      if (filters.wardNo) query.wardNo = filters.wardNo;
      if (filters.caseType) query.natureOfIssue = filters.caseType;
      if (filters.caseStatus) query.status = filters.caseStatus;
      if (filters.dateFrom || filters.dateTo) {
        query.dateOfReporting = {};
        if (filters.dateFrom)
          query.dateOfReporting.$gte = new Date(filters.dateFrom);
        if (filters.dateTo)
          query.dateOfReporting.$lte = new Date(filters.dateTo);
      }

      const cases = await LegalAidService.find(query)
        .populate("createdBy", "name")
        .sort({ dateOfReporting: -1 });

      const summary = {
        totalCases: cases.length,
        statusBreakdown: {},
        typeBreakdown: {},
        priorityBreakdown: {},
        monthlyTrend: {},
        averageResolutionTime: 0,
      };

      let totalResolutionTime = 0;
      let resolvedCases = 0;

      cases.forEach((caseItem) => {
        // Status breakdown
        const status = caseItem.status || "Pending";
        summary.statusBreakdown[status] =
          (summary.statusBreakdown[status] || 0) + 1;

        // Type breakdown
        const type = caseItem.natureOfIssue || "Other";
        summary.typeBreakdown[type] = (summary.typeBreakdown[type] || 0) + 1;

        // Priority breakdown
        const priority = caseItem.priority || "Medium";
        summary.priorityBreakdown[priority] =
          (summary.priorityBreakdown[priority] || 0) + 1;

        // Monthly trend
        const month = new Date(caseItem.dateOfReporting).toISOString().substring(0, 7);
        summary.monthlyTrend[month] = (summary.monthlyTrend[month] || 0) + 1;

        if (caseItem.status === "Resolved" && caseItem.updatedAt && caseItem.dateOfReporting) {
          const resolutionTime =
            (new Date(caseItem.updatedAt) - new Date(caseItem.dateOfReporting)) /
            (1000 * 60 * 60 * 24);
          totalResolutionTime += Math.max(resolutionTime, 0);
          resolvedCases++;
        }
      });

      if (resolvedCases > 0) {
        summary.averageResolutionTime = Math.round(
          totalResolutionTime / resolvedCases
        );
      }

      return {
        summary,
        cases,
      };
    } catch (error) {
      throw new APIError(500, `Error generating case report: ${error.message}`);
    }
  }
}

export default new LegalAidServiceService();
