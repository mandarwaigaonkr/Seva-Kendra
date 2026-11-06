import CompetitiveExam from "../models/competitiveExam.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class CompetitiveExamService {
  // Get all competitive exam records with pagination, search, and filters
  async getAllCompetitiveExams(query) {
    const {
      page = 1,
      limit = 10,
      search = "",
      wardNo = "",
      gender = "",
      typeOfExam = "",
      status = "",
      projectResponsible = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter = {};

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { householdCode: { $regex: escapeRegex(search), $options: "i" } },
        { habitation: { $regex: escapeRegex(search), $options: "i" } },
        { headOfHousehold: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    // Filter by ward number
    if (wardNo) {
      filter.wardNo = wardNo;
    }

    // Filter by gender
    if (gender) {
      filter.gender = gender;
    }

    // Filter by type of exam
    if (typeOfExam) {
      filter.typeOfExam = typeOfExam;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by project responsible
    if (projectResponsible) {
      filter.projectResponsible = { $regex: escapeRegex(projectResponsible), $options: "i" };
    }

    const { skip, limitNum, page: pageNum } = getPaginationOptions(page, limit);
    const sortField = /^[A-Za-z_][\w.]{0,60}$/.test(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [exams, total] = await Promise.all([
      CompetitiveExam.find(filter)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CompetitiveExam.countDocuments(filter),
    ]);

    return {
      data: exams,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get competitive exam by ID
  async getCompetitiveExamById(id) {
    const exam = await CompetitiveExam.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!exam) {
      throw new APIError(404, "Competitive exam record not found");
    }

    return exam;
  }

  // Create a new competitive exam record
  async createCompetitiveExam(data, userId) {
    // Check if household code already exists
    const existingExam = await CompetitiveExam.findOne({
      householdCode: data.householdCode,
    });
    if (existingExam) {
      throw new APIError(400, "Household code already exists");
    }

    const examData = {
      ...data,
      createdBy: userId,
    };

    const exam = new CompetitiveExam(examData);
    await exam.save();

    return await this.getCompetitiveExamById(exam._id);
  }

  // Update competitive exam by ID
  async updateCompetitiveExamById(id, data, userId) {
    // Check if household code is being updated and already exists
    if (data.householdCode) {
      const existingExam = await CompetitiveExam.findOne({
        householdCode: data.householdCode,
        _id: { $ne: id },
      });
      if (existingExam) {
        throw new APIError(400, "Household code already exists");
      }
    }

    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const exam = await CompetitiveExam.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!exam) {
      throw new APIError(404, "Competitive exam record not found");
    }

    return await this.getCompetitiveExamById(id);
  }

  // Delete competitive exam by ID
  async deleteCompetitiveExamById(id) {
    const exam = await CompetitiveExam.findByIdAndDelete(id);

    if (!exam) {
      throw new APIError(404, "Competitive exam record not found");
    }

    return exam;
  }

  // Get competitive exams statistics
  async getCompetitiveExamsStats() {
    const [total, byGender, byWard, byTypeOfExam, byStatus] = await Promise.all(
      [
        CompetitiveExam.countDocuments(),
        CompetitiveExam.aggregate([
          { $group: { _id: "$gender", count: { $sum: 1 } } },
        ]),
        CompetitiveExam.aggregate([
          { $group: { _id: "$wardNo", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        CompetitiveExam.aggregate([
          { $group: { _id: "$typeOfExam", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        CompetitiveExam.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]
    );

    return {
      total,
      byGender,
      byWard,
      byTypeOfExam,
      byStatus,
    };
  }

  // Get unique values for filters
  async getFilterOptions() {
    const [wardNumbers, projectResponsibles, genders, typeOfExams, statuses] =
      await Promise.all([
        CompetitiveExam.distinct("wardNo"),
        CompetitiveExam.distinct("projectResponsible"),
        CompetitiveExam.distinct("gender"),
        CompetitiveExam.distinct("typeOfExam"),
        CompetitiveExam.distinct("status"),
      ]);

    return {
      wardNumbers: wardNumbers.sort(),
      projectResponsibles: projectResponsibles.sort(),
      genders: genders.sort(),
      typeOfExams: typeOfExams.sort(),
      statuses: statuses.sort(),
    };
  }
}

export default new CompetitiveExamService();
