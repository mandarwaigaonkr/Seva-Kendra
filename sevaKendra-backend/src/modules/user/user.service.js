import { UserStatus, UserRole } from "./user.enum.js";
import { DefaultPermissions } from "./permission.enum.js";
import { generateAPIError } from "../../errors/apiError.js";
import User from "./user.model.js";
import { escapeRegex } from "../../utils/regex.utils.js";

const MIN_PASSWORD_LENGTH = 8;
const KNOWN_PERMISSIONS = new Set(DefaultPermissions.ADMIN);

const assertPassword = async (password) => {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw await generateAPIError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }
};

const assertRole = async (role) => {
  if (role !== undefined && !Object.values(UserRole).includes(role)) {
    throw await generateAPIError("Unknown role", 400);
  }
};

const assertStatus = async (status) => {
  if (status !== undefined && !Object.values(UserStatus).includes(status)) {
    throw await generateAPIError("Unknown status", 400);
  }
};

const cleanPermissions = async (permissions) => {
  if (!Array.isArray(permissions) || permissions.some((p) => !KNOWN_PERMISSIONS.has(p))) {
    throw await generateAPIError("Permissions must be a list of known permissions", 400);
  }
  return [...new Set(permissions)];
};

/** Refuses a change that would leave no active admin who can sign in. */
const assertNotLastActiveAdmin = async (user) => {
  if (user.role !== UserRole.ADMIN || user.status !== UserStatus.ACTIVE) return;
  const others = await User.countDocuments({
    _id: { $ne: user._id },
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });
  if (others === 0) {
    throw await generateAPIError("This is the last active admin. Make another user an admin first.", 400);
  }
};

export const createUser = async (payload) => {
  if (!payload.status) payload.status = UserStatus.ACTIVE;
  if (!payload.permissions) {
    payload.permissions = payload.role === UserRole.ADMIN 
      ? DefaultPermissions.ADMIN 
      : DefaultPermissions.USER;
  }
  return User.create(payload);
};

export const findById = async (id) => User.findById(id);

export const findByEmail = async (email) => User.findOne({ email });

export const listUsers = async ({ page = 1, limit = 20 }) => {
  const p = parseInt(page, 20) || 1;
  const l = parseInt(limit, 10) || 20;
  const skip = (page - 1) * l;
  const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(l);
  const total = await User.countDocuments();
  return { users, total, page: p, limit: l };
};

/**
 * Get all users with filters (Admin only)
 */
export const getAllUsers = async (query) => {
  const { page = 1, limit = 10, search = "", role, status } = query;
  
  const filter = {};
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: escapeRegex(search), $options: "i" } },
      { lastName: { $regex: escapeRegex(search), $options: "i" } },
      { email: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }
  
  if (role) {
    filter.role = role;
  }
  
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select("-password")
    .populate("createdBy", "firstName lastName email");
  
  if (!user) {
    throw await generateAPIError("User not found", 404);
  }
  
  return user;
};

/**
 * Create new user (Admin only)
 */
export const createUserByAdmin = async (userData, adminId) => {
  const { email, password, firstName, lastName, role, permissions } = userData;

  if (typeof email !== "string" || !email.trim()) {
    throw await generateAPIError("Email is required", 400);
  }
  await assertPassword(password);
  await assertRole(role);
  const cleanedPermissions = permissions === undefined ? undefined : await cleanPermissions(permissions);

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw await generateAPIError("User with this email already exists", 400);
  }
  
  const user = new User({
    email: email.toLowerCase(),
    password,
    firstName,
    lastName,
    role: role || UserRole.USER,
    status: UserStatus.ACTIVE,
    permissions: cleanedPermissions || (role === UserRole.ADMIN ? DefaultPermissions.ADMIN : DefaultPermissions.USER),
    createdBy: adminId,
  });
  
  await user.save();
  
  const userObj = user.toObject();
  delete userObj.password;
  
  return userObj;
};

/**
 * Update user
 */
export const updateUser = async (userId, updateData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw await generateAPIError("User not found", 404);
  }
  
  const { email, firstName, lastName, role, status, permissions, password } = updateData;

  await assertRole(role);
  await assertStatus(status);
  if (password) await assertPassword(password);
  const cleanedPermissions = permissions === undefined ? undefined : await cleanPermissions(permissions);

  const losesAdmin =
    (role && role !== UserRole.ADMIN) || (status && status !== UserStatus.ACTIVE);
  if (losesAdmin) await assertNotLastActiveAdmin(user);

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw await generateAPIError("Email already in use", 400);
    }
    user.email = email.toLowerCase();
  }
  
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (role && role !== user.role) {
    user.role = role;
    // A role change resets permissions to that role's defaults unless new ones are given,
    // so a demoted admin does not keep admin permissions.
    if (!cleanedPermissions) {
      user.permissions = role === UserRole.ADMIN ? DefaultPermissions.ADMIN : DefaultPermissions.USER;
    }
  }
  if (status) user.status = status;
  if (cleanedPermissions) user.permissions = cleanedPermissions;
  
  if (password) {
    user.password = password;
  }
  
  await user.save();
  
  const userObj = user.toObject();
  delete userObj.password;
  
  return userObj;
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw await generateAPIError("User not found", 404);
  }
  
  await assertNotLastActiveAdmin(user);

  await User.findByIdAndDelete(userId);
  
  return { message: "User deleted successfully" };
};

/**
 * Update user permissions
 */
export const updateUserPermissions = async (userId, permissions) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw await generateAPIError("User not found", 404);
  }
  
  if (user.role === UserRole.ADMIN) {
    throw await generateAPIError("Cannot modify admin permissions directly", 400);
  }

  user.permissions = await cleanPermissions(permissions);
  await user.save();
  
  const userObj = user.toObject();
  delete userObj.password;
  
  return userObj;
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  const [totalUsers, activeUsers, pendingUsers, suspendedUsers, adminCount, userCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: UserStatus.ACTIVE }),
    User.countDocuments({ status: UserStatus.PENDING }),
    User.countDocuments({ status: UserStatus.SUSPENDED }),
    User.countDocuments({ role: UserRole.ADMIN }),
    User.countDocuments({ role: UserRole.USER }),
  ]);
  
  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    adminCount,
    userCount,
  };
};

