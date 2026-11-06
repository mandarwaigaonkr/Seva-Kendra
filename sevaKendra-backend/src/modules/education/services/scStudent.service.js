import SCStudent from "../models/scStudent.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class SCStudentService {
  // Get all SC students with pagination, search, and filters
  async getAllSCStudents(query) {
    const {
      page = 1,
      limit = 10,
      search = "",
      wardNo = "",
      gender = "",
      studentStatus = "",
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

    // Filter by student status
    if (studentStatus) {
      filter.studentStatus = { $regex: new RegExp(`^${escapeRegex(studentStatus)}$`, "i") };
    }

    // Filter by project responsible
    if (projectResponsible) {
      filter.projectResponsible = { $regex: escapeRegex(projectResponsible), $options: "i" };
    }

    const { skip, limitNum, page: pageNum } = getPaginationOptions(page, limit);
    const sortField = /^[A-Za-z_][\w.]{0,60}$/.test(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [students, total] = await Promise.all([
      SCStudent.find(filter)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SCStudent.countDocuments(filter),
    ]);

    return {
      data: students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get SC student by ID
  async getSCStudentById(id) {
    const student = await SCStudent.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!student) {
      throw new APIError(404, "SC student not found");
    }

    return student;
  }

  // Create a new SC student
  async createSCStudent(data, userId) {
    // Check if household code already exists
    const existingStudent = await SCStudent.findOne({
      householdCode: data.householdCode,
    });
    if (existingStudent) {
      throw new APIError(400, "Household code already exists");
    }

    const studentData = {
      ...data,
      createdBy: userId,
    };

    const student = new SCStudent(studentData);
    await student.save();

    return await this.getSCStudentById(student._id);
  }

  // Update SC student by ID
  async updateSCStudentById(id, data, userId) {
    // Check if household code is being updated and already exists
    if (data.householdCode) {
      const existingStudent = await SCStudent.findOne({
        householdCode: data.householdCode,
        _id: { $ne: id },
      });
      if (existingStudent) {
        throw new APIError(400, "Household code already exists");
      }
    }

    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const student = await SCStudent.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      throw new APIError(404, "SC student not found");
    }

    return await this.getSCStudentById(id);
  }

  // Delete SC student by ID
  async deleteSCStudentById(id) {
    const student = await SCStudent.findByIdAndDelete(id);

    if (!student) {
      throw new APIError(404, "SC student not found");
    }

    return student;
  }

  // Get SC students statistics
  async getSCStudentsStats() {
    const [total, byGender, byWard, byAge, byStatus] = await Promise.all([
      SCStudent.countDocuments(),
      SCStudent.aggregate([{ $group: { _id: "$gender", count: { $sum: 1 } } }]),
      SCStudent.aggregate([
        { $group: { _id: "$wardNo", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SCStudent.aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ["$age", 12] }, then: "0-12" },
                  { case: { $lte: ["$age", 18] }, then: "13-18" },
                  { case: { $lte: ["$age", 25] }, then: "19-25" },
                ],
                default: "25+",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      SCStudent.aggregate([{ $group: { _id: { $ifNull: ["$studentStatus", "Unknown"] }, count: { $sum: 1 } } }]),
    ]);

    return {
      total,
      byGender,
      byWard,
      byAge,
      byStatus,
    };
  }

  // Get unique values for filters
  async getFilterOptions() {
    const [wardNumbers, projectResponsibles, genders, studentStatuses] =
      await Promise.all([
        SCStudent.distinct("wardNo"),
        SCStudent.distinct("projectResponsible"),
        SCStudent.distinct("gender"),
        SCStudent.distinct("studentStatus"),
      ]);

    return {
      wardNumbers: wardNumbers.sort(),
      projectResponsibles: projectResponsibles.sort(),
      genders: genders.sort(),
      studentStatuses: studentStatuses.sort(),
    };
  }
}

export default new SCStudentService();
