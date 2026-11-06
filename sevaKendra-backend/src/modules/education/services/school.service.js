import School from "../models/school.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class SchoolService {
  // Get all schools with pagination, search, and filters
  async getAllSchools(query) {
    const {
      page = 1,
      limit = 10,
      search = "",
      wardNo = "",
      educationLevel = "",
      typeOfStudents = "",
      projectResponsible = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter = {};

    // Search functionality
    if (search) {
      filter.$or = [
        { schoolName: { $regex: escapeRegex(search), $options: "i" } },
        { schoolCode: { $regex: escapeRegex(search), $options: "i" } },
        { principalName: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    // Filter by ward number
    if (wardNo) {
      filter.wardNo = wardNo;
    }

    // Filter by education level
    if (educationLevel) {
      filter.educationLevel = educationLevel;
    }

    // Filter by type of students
    if (typeOfStudents) {
      filter.typeOfStudents = typeOfStudents;
    }

    // Filter by project responsible
    if (projectResponsible) {
      filter.projectResponsible = { $regex: escapeRegex(projectResponsible), $options: "i" };
    }

    const { skip, limitNum, page: pageNum } = getPaginationOptions(page, limit);
    const sortField = /^[A-Za-z_][\w.]{0,60}$/.test(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [schools, total] = await Promise.all([
      School.find(filter)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      School.countDocuments(filter),
    ]);

    return {
      data: schools,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get school by ID
  async getSchoolById(id) {
    const school = await School.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!school) {
      throw new APIError(404, "School not found");
    }

    return school;
  }

  // Create a new school
  async createSchool(data, userId) {
    // Check if school code already exists
    const existingSchool = await School.findOne({
      schoolCode: data.schoolCode,
    });
    if (existingSchool) {
      throw new APIError(400, "School code already exists");
    }

    const schoolData = {
      ...data,
      createdBy: userId,
    };

    const school = new School(schoolData);
    await school.save();

    return await this.getSchoolById(school._id);
  }

  // Update school by ID
  async updateSchoolById(id, data, userId) {
    // Check if school code is being updated and already exists
    if (data.schoolCode) {
      const existingSchool = await School.findOne({
        schoolCode: data.schoolCode,
        _id: { $ne: id },
      });
      if (existingSchool) {
        throw new APIError(400, "School code already exists");
      }
    }

    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const school = await School.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!school) {
      throw new APIError(404, "School not found");
    }

    return await this.getSchoolById(id);
  }

  // Delete school by ID
  async deleteSchoolById(id) {
    const school = await School.findByIdAndDelete(id);

    if (!school) {
      throw new APIError(404, "School not found");
    }

    return school;
  }

  // Get schools statistics
  async getSchoolsStats() {
    const [total, byEducationLevel, byWard, byTypeOfStudents, totalStudents] =
      await Promise.all([
        School.countDocuments(),
        School.aggregate([
          { $group: { _id: "$educationLevel", count: { $sum: 1 } } },
        ]),
        School.aggregate([
          { $group: { _id: "$wardNo", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        School.aggregate([
          { $group: { _id: "$typeOfStudents", count: { $sum: 1 } } },
        ]),
        School.aggregate([
          { $group: { _id: null, total: { $sum: "$totalStudents" } } },
        ]),
      ]);

    return {
      total,
      byEducationLevel,
      byWard,
      byTypeOfStudents,
      totalStudents: totalStudents[0]?.total || 0,
    };
  }

  // Get unique values for filters
  async getFilterOptions() {
    const [wardNumbers, projectResponsibles, educationLevels, typeOfStudents] =
      await Promise.all([
        School.distinct("wardNo"),
        School.distinct("projectResponsible"),
        School.distinct("educationLevel"),
        School.distinct("typeOfStudents"),
      ]);

    return {
      wardNumbers: wardNumbers.sort(),
      projectResponsibles: projectResponsibles.sort(),
      educationLevels: educationLevels.sort(),
      typeOfStudents: typeOfStudents.sort(),
    };
  }
}

export default new SchoolService();
