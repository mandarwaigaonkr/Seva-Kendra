import { UserRole, UserStatus } from "./user.enum.js";
import { DefaultPermissions } from "./permission.enum.js";
import { verifyValue } from "../../utils/auth.utils.js";
import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      minLength: [6, "Password must be atleast 6 characters"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    permissions: {
      type: [String],
      default: function() {
        return this.role === UserRole.ADMIN 
          ? DefaultPermissions.ADMIN 
          : DefaultPermissions.USER;
      },
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.role === UserRole.USER;
      },
    },
    lastLogin: {
      type: Date,
    },
    // Bumped on password change and sign-out; tokens carrying an older value stop working.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  if (!this.isNew) this.tokenVersion = (this.tokenVersion || 0) + 1;
  next();
});

userSchema.methods.passwordMatch = function (enteredPassword) {
  return verifyValue(enteredPassword, this.password);
};

const User = model("User", userSchema);
export default User;
