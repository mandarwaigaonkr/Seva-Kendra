import WorkshopsAwareness from "../models/workshopsAwareness.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class WorkshopsAwarenessService {
  /**
   * Create a new Workshops & Awareness record
   * @param {Object} workshopsData - The workshops & awareness data
   * @param {String} userId - The ID of the user creating the record
   * @returns {Promise<Object>} The created workshops & awareness record
   */
  async createWorkshopsAwareness(workshopsData, userId) {
    try {
      const workshop = new WorkshopsAwareness({
        ...workshopsData,
        createdBy: userId,
      });
      return await workshop.save();
    } catch (error) {
      throw new APIError(
        400,
        `Error creating workshops & awareness: ${error.message}`
      );
    }
  }

  /**
   * Get all Workshops & Awareness records with pagination and filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated workshops & awareness records
   */
  async getAllWorkshopsAwareness(filters = {}, options = {}) {
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
      if (filters.trainingCategory)
        query.trainingCategory = filters.trainingCategory;
      if (filters.projectResponsible)
        query.projectResponsible = new RegExp(escapeRegex(filters.projectResponsible), "i");

      // Date range filters
      if (filters.dateFrom || filters.dateTo) {
        query.dateOfTraining = {};
        if (filters.dateFrom)
          query.dateOfTraining.$gte = new Date(filters.dateFrom);
        if (filters.dateTo)
          query.dateOfTraining.$lte = new Date(filters.dateTo);
      }

      // Apply search
      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        const searchQuery = {
          $or: [
            { groupId: searchRegex },
            { groupName: searchRegex },
            { groupType: searchRegex },
            { topic: searchRegex },
            { trainingCategory: searchRegex },
            { venue: searchRegex },
            { resourcePerson: searchRegex },
            { habitation: searchRegex },
            { projectResponsible: searchRegex },
            { remarks: searchRegex },
          ],
        };
        query = { ...query, ...searchQuery };
      }

      // Execute query with pagination
      const workshops = await WorkshopsAwareness.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      const total = await WorkshopsAwareness.countDocuments(query);

      return {
        data: workshops,
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
        `Error fetching workshops & awareness: ${error.message}`
      );
    }
  }

  /**
   * Get a single Workshops & Awareness record by ID
   * @param {String} id - The ID of the workshops & awareness record
   * @returns {Promise<Object>} The workshops & awareness record
   */
  async getWorkshopsAwarenessById(id) {
    try {
      const workshop = await WorkshopsAwareness.findById(id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      return workshop;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        500,
        `Error fetching workshops & awareness: ${error.message}`
      );
    }
  }

  /**
   * Update a Workshops & Awareness record
   * @param {String} id - The ID of the workshops & awareness record
   * @param {Object} updateData - The data to update
   * @param {String} userId - The ID of the user updating the record
   * @returns {Promise<Object>} The updated workshops & awareness record
   */
  async updateWorkshopsAwareness(id, updateData, userId) {
    try {
      const workshop = await WorkshopsAwareness.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: userId },
        { new: true, runValidators: true }
      )
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      return workshop;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error updating workshops & awareness: ${error.message}`
      );
    }
  }

  /**
   * Delete a Workshops & Awareness record
   * @param {String} id - The ID of the workshops & awareness record
   * @returns {Promise<Object>} Success message
   */
  async deleteWorkshopsAwareness(id) {
    try {
      const workshop = await WorkshopsAwareness.findByIdAndDelete(id);

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      return { message: "Workshops & awareness record deleted successfully" };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        500,
        `Error deleting workshops & awareness: ${error.message}`
      );
    }
  }

  /**
   * Get Workshops & Awareness statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getWorkshopsAwarenessStats() {
    try {
      return await WorkshopsAwareness.getStats();
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching workshops & awareness statistics: ${error.message}`
      );
    }
  }

  /**
   * Get Workshops & Awareness by ward
   * @param {String} wardNo - Ward number
   * @returns {Promise<Array>} Workshops & awareness records for the ward
   */
  async getWorkshopsAwarenessByWard(wardNo) {
    try {
      return await WorkshopsAwareness.find({ wardNo })
        .populate("createdBy", "name")
        .sort({ dateOfTraining: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching workshops & awareness by ward: ${error.message}`
      );
    }
  }

  /**
   * Get Workshops & Awareness by habitation
   * @param {String} habitation - Habitation name
   * @returns {Promise<Array>} Workshops & awareness records for the habitation
   */
  async getWorkshopsAwarenessByHabitation(habitation) {
    try {
      return await WorkshopsAwareness.find({
        habitation: new RegExp(escapeRegex(habitation), "i"),
      })
        .populate("createdBy", "name")
        .sort({ dateOfTraining: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching workshops & awareness by habitation: ${error.message}`
      );
    }
  }

  /**
   * Get Workshops & Awareness by group type
   * @param {String} groupType - Group type
   * @returns {Promise<Array>} Workshops & awareness records for the group type
   */
  async getWorkshopsAwarenessByGroupType(groupType) {
    try {
      return await WorkshopsAwareness.find({ groupType })
        .populate("createdBy", "name")
        .sort({ dateOfTraining: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching workshops & awareness by group type: ${error.message}`
      );
    }
  }

  /**
   * Get Workshops & Awareness by training category
   * @param {String} trainingCategory - Training category
   * @returns {Promise<Array>} Workshops & awareness records for the training category
   */
  async getWorkshopsAwarenessByCategory(trainingCategory) {
    try {
      return await WorkshopsAwareness.find({ trainingCategory })
        .populate("createdBy", "name")
        .sort({ dateOfTraining: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching workshops & awareness by category: ${error.message}`
      );
    }
  }

  /**
   * Add participant to workshop
   * @param {String} id - The ID of the workshops & awareness record
   * @param {Object} participantData - Participant data
   * @param {String} userId - The ID of the user adding the participant
   * @returns {Promise<Object>} The updated workshops & awareness record
   */
  async addParticipant(id, participantData, userId) {
    try {
      const workshop = await WorkshopsAwareness.findById(id);

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      workshop.participantList.push(participantData);
      workshop.totalParticipants = workshop.participantList.length;
      workshop.updatedBy = userId;

      return await workshop.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(400, `Error adding participant: ${error.message}`);
    }
  }

  /**
   * Update participant attendance
   * @param {String} id - The ID of the workshops & awareness record
   * @param {String} participantId - The ID of the participant to update
   * @param {String} attendance - Attendance status
   * @param {String} userId - The ID of the user updating the attendance
   * @returns {Promise<Object>} The updated workshops & awareness record
   */
  async updateParticipantAttendance(id, participantId, attendance, userId) {
    try {
      const workshop = await WorkshopsAwareness.findById(id);

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      const participant = workshop.participantList.id(participantId);
      if (!participant) {
        throw new APIError(404, "Participant not found");
      }

      participant.attendance = attendance;
      workshop.updatedBy = userId;

      return await workshop.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error updating participant attendance: ${error.message}`
      );
    }
  }

  /**
   * Add learning objective
   * @param {String} id - The ID of the workshops & awareness record
   * @param {Object} objectiveData - Learning objective data
   * @param {String} userId - The ID of the user adding the objective
   * @returns {Promise<Object>} The updated workshops & awareness record
   */
  async addLearningObjective(id, objectiveData, userId) {
    try {
      const workshop = await WorkshopsAwareness.findById(id);

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      workshop.learningObjectives.push(objectiveData);
      workshop.updatedBy = userId;

      return await workshop.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error adding learning objective: ${error.message}`
      );
    }
  }

  /**
   * Update learning objective achievement
   * @param {String} id - The ID of the workshops & awareness record
   * @param {String} objectiveId - The ID of the learning objective to update
   * @param {Boolean} achieved - Achievement status
   * @param {String} remarks - Remarks
   * @param {String} userId - The ID of the user updating the objective
   * @returns {Promise<Object>} The updated workshops & awareness record
   */
  async updateLearningObjective(id, objectiveId, achieved, remarks, userId) {
    try {
      const workshop = await WorkshopsAwareness.findById(id);

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      const objective = workshop.learningObjectives.id(objectiveId);
      if (!objective) {
        throw new APIError(404, "Learning objective not found");
      }

      objective.achieved = achieved;
      if (remarks) objective.remarks = remarks;
      workshop.updatedBy = userId;

      return await workshop.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error updating learning objective: ${error.message}`
      );
    }
  }

  /**
   * Add follow-up action
   * @param {String} id - The ID of the workshops & awareness record
   * @param {Object} actionData - Follow-up action data
   * @param {String} userId - The ID of the user adding the action
   * @returns {Promise<Object>} The updated workshops & awareness record
   */
  async addFollowUpAction(id, actionData, userId) {
    try {
      const workshop = await WorkshopsAwareness.findById(id);

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      workshop.followUpActions.push(actionData);
      workshop.followUpRequired = true;
      workshop.updatedBy = userId;

      return await workshop.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error adding follow-up action: ${error.message}`
      );
    }
  }

  /**
   * Update follow-up action status
   * @param {String} id - The ID of the workshops & awareness record
   * @param {String} actionId - The ID of the follow-up action to update
   * @param {String} status - New status
   * @param {String} userId - The ID of the user updating the status
   * @returns {Promise<Object>} The updated workshops & awareness record
   */
  async updateFollowUpActionStatus(id, actionId, status, userId) {
    try {
      const workshop = await WorkshopsAwareness.findById(id);

      if (!workshop) {
        throw new APIError(404, "Workshops & awareness record not found");
      }

      const action = workshop.followUpActions.id(actionId);
      if (!action) {
        throw new APIError(404, "Follow-up action not found");
      }

      action.status = status;
      workshop.updatedBy = userId;

      return await workshop.save();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        400,
        `Error updating follow-up action status: ${error.message}`
      );
    }
  }

  /**
   * Get workshops requiring follow-up
   * @returns {Promise<Array>} Workshops & awareness records requiring follow-up
   */
  async getWorkshopsRequiringFollowUp() {
    try {
      const today = new Date();
      return await WorkshopsAwareness.find({
        $or: [
          { followUpDate: { $lte: today } },
          { followUpRequired: true },
          { "followUpActions.status": "Pending" },
        ],
      })
        .populate("createdBy", "name")
        .sort({ followUpDate: 1, dateOfTraining: -1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching workshops requiring follow-up: ${error.message}`
      );
    }
  }

  /**
   * Generate training effectiveness report
   * @param {Object} filters - Filter criteria for the report
   * @returns {Promise<Object>} Training effectiveness report
   */
  async generateEffectivenessReport(filters = {}) {
    try {
      let query = {};

      // Apply filters
      if (filters.wardNo) query.wardNo = filters.wardNo;
      if (filters.trainingCategory)
        query.trainingCategory = filters.trainingCategory;
      if (filters.dateFrom || filters.dateTo) {
        query.dateOfTraining = {};
        if (filters.dateFrom)
          query.dateOfTraining.$gte = new Date(filters.dateFrom);
        if (filters.dateTo)
          query.dateOfTraining.$lte = new Date(filters.dateTo);
      }

      const workshops = await WorkshopsAwareness.find(query)
        .populate("createdBy", "name")
        .sort({ dateOfTraining: -1 });

      const report = {
        totalWorkshops: workshops.length,
        totalParticipants: 0,
        averageEffectiveness: 0,
        categoryEffectiveness: {},
        groupTypeEffectiveness: {},
        averageFeedbackScore: 0,
        budgetUtilization: {
          totalAllocated: 0,
          totalExpense: 0,
          utilizationPercentage: 0,
        },
        monthlyTrend: {},
      };

      let totalEffectiveness = 0;
      let workshopsWithEffectiveness = 0;
      let totalFeedbackScore = 0;
      let workshopsWithFeedback = 0;

      workshops.forEach((workshop) => {
        report.totalParticipants += workshop.totalParticipants;

        // Budget tracking
        if (workshop.budgetAllocated) {
          report.budgetUtilization.totalAllocated += workshop.budgetAllocated;
        }
        if (workshop.actualExpense) {
          report.budgetUtilization.totalExpense += workshop.actualExpense;
        }

        // Effectiveness calculation
        const effectiveness = workshop.trainingEffectiveness;
        if (effectiveness !== null && effectiveness !== undefined) {
          totalEffectiveness += effectiveness;
          workshopsWithEffectiveness++;

          // Category effectiveness
          const category = workshop.trainingCategory;
          if (!report.categoryEffectiveness[category]) {
            report.categoryEffectiveness[category] = { total: 0, count: 0 };
          }
          report.categoryEffectiveness[category].total += effectiveness;
          report.categoryEffectiveness[category].count++;

          // Group type effectiveness
          const groupType = workshop.groupType;
          if (!report.groupTypeEffectiveness[groupType]) {
            report.groupTypeEffectiveness[groupType] = { total: 0, count: 0 };
          }
          report.groupTypeEffectiveness[groupType].total += effectiveness;
          report.groupTypeEffectiveness[groupType].count++;
        }

        // Feedback score
        if (workshop.feedbackScore) {
          totalFeedbackScore += workshop.feedbackScore;
          workshopsWithFeedback++;
        }

        // Monthly trend
        const month = workshop.dateOfTraining.toISOString().substring(0, 7);
        if (!report.monthlyTrend[month]) {
          report.monthlyTrend[month] = { workshops: 0, participants: 0 };
        }
        report.monthlyTrend[month].workshops++;
        report.monthlyTrend[month].participants += workshop.totalParticipants;
      });

      // Calculate averages
      if (workshopsWithEffectiveness > 0) {
        report.averageEffectiveness = Math.round(
          totalEffectiveness / workshopsWithEffectiveness
        );
      }

      if (workshopsWithFeedback > 0) {
        report.averageFeedbackScore =
          Math.round((totalFeedbackScore / workshopsWithFeedback) * 10) / 10;
      }

      // Calculate budget utilization
      if (report.budgetUtilization.totalAllocated > 0) {
        report.budgetUtilization.utilizationPercentage = Math.round(
          (report.budgetUtilization.totalExpense /
            report.budgetUtilization.totalAllocated) *
            100
        );
      }

      // Calculate category averages
      Object.keys(report.categoryEffectiveness).forEach((category) => {
        const data = report.categoryEffectiveness[category];
        report.categoryEffectiveness[category] = Math.round(
          data.total / data.count
        );
      });

      // Calculate group type averages
      Object.keys(report.groupTypeEffectiveness).forEach((groupType) => {
        const data = report.groupTypeEffectiveness[groupType];
        report.groupTypeEffectiveness[groupType] = Math.round(
          data.total / data.count
        );
      });

      return {
        report,
        workshops,
      };
    } catch (error) {
      throw new APIError(
        500,
        `Error generating effectiveness report: ${error.message}`
      );
    }
  }

  /**
   * Get upcoming workshops
   * @param {Number} days - Number of days to look ahead (default: 30)
   * @returns {Promise<Array>} Upcoming workshops & awareness records
   */
  async getUpcomingWorkshops(days = 30) {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

      return await WorkshopsAwareness.find({
        dateOfTraining: {
          $gte: today,
          $lte: futureDate,
        },
      })
        .populate("createdBy", "name")
        .sort({ dateOfTraining: 1 });
    } catch (error) {
      throw new APIError(
        500,
        `Error fetching upcoming workshops: ${error.message}`
      );
    }
  }
}

export default new WorkshopsAwarenessService();
