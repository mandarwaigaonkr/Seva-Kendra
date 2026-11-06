import { errorWrapper } from "../../middleware/errorWrapper.js";
import { responseUtils } from "../../utils/response.utils.js";
import * as authService from "./auth.service.js";
import User from "../user/user.model.js";

export const login = errorWrapper(async (req, res) => {
  const result = await authService.login(req.body);
  responseUtils.success(res, {
    status: 200,
    data: result,
    message: "Login successful",
  });
});

// Signing out ends every session of this user: the token version moves on, so the old
// token (and any copy of it) is refused from the next request.
export const logout = errorWrapper(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  responseUtils.success(res, {
    status: 200,
    message: "Logout successful",
  });
});

// Returns the current user as stored now, so the app can refresh role and permissions.
export const verifyToken = errorWrapper(async (req, res) => {
  responseUtils.success(res, {
    status: 200,
    data: { user: authService.toPublicUser(req.user) },
    message: "Token verified",
  });
});
