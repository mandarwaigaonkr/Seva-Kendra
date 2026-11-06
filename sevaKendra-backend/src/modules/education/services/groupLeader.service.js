import GroupLeader from "../models/groupLeader.model.js";
import { APIError } from "../../../errors/apiError.js";
import { getPaginationOptions } from "../../../utils/pagination.utils.js";
import { escapeRegex } from "../../../utils/regex.utils.js";

class GroupLeaderService {
  // Get all group leaders with pagination, search, and filters
  async getAllGroupLeaders(query) {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
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
      filter.status = status;
    }

    const { skip, limitNum, page: pageNum } = getPaginationOptions(page, limit);
    const sortField = /^[A-Za-z_][\w.]{0,60}$/.test(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [groupLeaders, total] = await Promise.all([
      GroupLeader.find(filter)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .populate("assignedStudyCenters", "centreName centreCode")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      GroupLeader.countDocuments(filter),
    ]);

    return {
      data: groupLeaders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get all group leaders as dropdown (active only)
  async getGroupLeadersDropdown() {
    const groupLeaders = await GroupLeader.find({ status: "Active" })
      .select("_id leaderId firstName lastName email phoneNumber fullName")
      .lean()
      .sort({ firstName: 1 });

    return groupLeaders.map((leader) => ({
      id: leader._id,
      leaderId: leader.leaderId,
      label: `${leader.firstName} ${leader.lastName}`,
      value: leader._id,
      firstName: leader.firstName,
      lastName: leader.lastName,
      email: leader.email,
      phoneNumber: leader.phoneNumber,
    }));
  }

  // Get group leader by ID
  async getGroupLeaderById(id) {
    const groupLeader = await GroupLeader.findById(id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName")
      .populate("assignedStudyCenters", "centreName centreCode");

    if (!groupLeader) {
      throw new APIError("Group leader not found", 404);
    }

    return groupLeader;
  }

  // Create a new group leader
  async createGroupLeader(data, userId) {
    // Check if leader ID already exists
    if (data.leaderId) {
      const existingLeader = await GroupLeader.findOne({ leaderId: data.leaderId });
      if (existingLeader) {
        throw new APIError("Leader ID already exists", 400);
      }
    }

    const groupLeaderData = {
      ...data,
      createdBy: userId,
    };

    const groupLeader = new GroupLeader(groupLeaderData);
    await groupLeader.save();

    return await this.getGroupLeaderById(groupLeader._id);
  }

  // Update group leader by ID
  async updateGroupLeaderById(id, data, userId) {
    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const groupLeader = await GroupLeader.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!groupLeader) {
      throw new APIError("Group leader not found", 404);
    }

    return await this.getGroupLeaderById(id);
  }

  // Delete group leader by ID
  async deleteGroupLeaderById(id) {
    const groupLeader = await GroupLeader.findByIdAndDelete(id);

    if (!groupLeader) {
      throw new APIError("Group leader not found", 404);
    }

    return groupLeader;
  }

  // Get filter options
  async getFilterOptions() {
    const statuses = await GroupLeader.distinct("status");

    return {
      statuses,
    };
  }

  // Get group leaders count
  async getGroupLeadersStats() {
    const stats = await GroupLeader.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$status", "Active"] },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total: await GroupLeader.countDocuments(),
      byStatus: stats,
    };
  }
}

export default new GroupLeaderService();
