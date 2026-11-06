import Teacher from "../models/teacher.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class TeacherService {
  // Get all teachers with pagination, search, and filters
  async getAllTeachers(query) {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      specialization = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter = {};

    // Search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: escapeRegex(search), $options: "i" } },
        { lastName: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
        { phoneNumber: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      filter.status = { $regex: new RegExp(`^${escapeRegex(status)}$`, "i") };
    }

    // Filter by specialization
    if (specialization) {
      filter.specialization = { $regex: new RegExp(`^${escapeRegex(specialization)}$`, "i") };
    }

    const { skip, limitNum, page: pageNum } = getPaginationOptions(page, limit);
    const sortField = /^[A-Za-z_][\w.]{0,60}$/.test(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [teachers, total] = await Promise.all([
      Teacher.find(filter)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .populate("studyCenters", "centreName centreCode")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Teacher.countDocuments(filter),
    ]);

    return {
      data: teachers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get all teachers as dropdown (active only)
  async getTeachersDropdown() {
    const teachers = await Teacher.find({ status: "Active" })
      .select("_id teacherId firstName lastName email phoneNumber specialization fullName")
      .lean()
      .sort({ firstName: 1 });

    return teachers.map((teacher) => ({
      id: teacher._id,
      teacherId: teacher.teacherId,
      label: `${teacher.firstName} ${teacher.lastName} (${teacher.specialization})`,
      value: teacher._id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber,
      specialization: teacher.specialization,
    }));
  }

  // Get teacher by ID
  async getTeacherById(id) {
    const teacher = await Teacher.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName")
      .populate("studyCenters", "centreName centreCode");

    if (!teacher) {
      throw new APIError("Teacher not found", 404);
    }

    return teacher;
  }

  // Create a new teacher
  async createTeacher(data, userId) {
    // Check if teacher ID already exists
    if (data.teacherId) {
      const existingTeacher = await Teacher.findOne({ teacherId: data.teacherId });
      if (existingTeacher) {
        throw new APIError("Teacher ID already exists", 400);
      }
    }

    const teacherData = {
      ...data,
      createdBy: userId,
    };

    const teacher = new Teacher(teacherData);
    await teacher.save();

    return await this.getTeacherById(teacher._id);
  }

  // Update teacher by ID
  async updateTeacherById(id, data, userId) {
    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const teacher = await Teacher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!teacher) {
      throw new APIError("Teacher not found", 404);
    }

    return await this.getTeacherById(id);
  }

  // Delete teacher by ID
  async deleteTeacherById(id) {
    const teacher = await Teacher.findByIdAndDelete(id);

    if (!teacher) {
      throw new APIError("Teacher not found", 404);
    }

    return teacher;
  }

  // Get filter options
  async getFilterOptions() {
    const [specializations, statuses] = await Promise.all([
      Teacher.distinct("specialization"),
      Teacher.distinct("status"),
    ]);

    return {
      specializations,
      statuses,
    };
  }

  // Get teachers count
  async getTeachersStats() {
    const stats = await Teacher.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$status", "Active"] },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total: await Teacher.countDocuments(),
      byStatus: stats,
    };
  }
}

export default new TeacherService();
