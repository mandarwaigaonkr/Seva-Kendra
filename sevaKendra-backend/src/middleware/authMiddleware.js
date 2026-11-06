import { decodeToken } from "../utils/auth.utils.js";
import User from "../modules/user/user.model.js";
import { UserStatus } from "../modules/user/user.enum.js";

/**
 * Loads the signed-in user from the database on every request. The token only proves
 * who the caller was when it was issued; role, permissions and status always come from
 * the current user document, so deleting, suspending, demoting or re-permissioning a
 * user takes effect on their next request.
 */
const loadActiveUser = async (req, res) => {
  const decoded = await decodeToken(req, res);
  if (!decoded) return null;

  let user = null;
  try {
    user = await User.findById(decoded.userId).select("-password");
  } catch {
    user = null; // malformed id inside an otherwise valid token
  }

  // Tokens from before the last password change or sign-out carry an older version.
  if (!user || (decoded.v ?? 0) !== (user.tokenVersion || 0)) {
    res.status(401).send({ success: false, message: "Your session has ended. Please sign in again." });
    return null;
  }

  if (user.status !== UserStatus.ACTIVE) {
    res.status(403).send({ success: false, message: "This account is not active. Please contact an administrator." });
    return null;
  }

  return { user, decoded };
};

const verifyTokenExists = async (req, res, next) => {
  try {
    const loaded = await loadActiveUser(req, res);
    if (!loaded) return;

    const { user, decoded } = loaded;
    req.user = {
      _id: user._id,
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      permissions: user.permissions || [],
    };
    req.decodedToken = decoded;
    return next();
  } catch (error) {
    return next(error);
  }
};

const verifyUserRole = (allowedRoles) => async (req, res, next) => {
  try {
    const loaded = await loadActiveUser(req, res);
    if (!loaded) return;

    const { user } = loaded;
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).send({ success: false, message: "Access denied. Insufficient permissions." });
    }

    req.user = user;
    req.user.currentRole = user.role;
    req.user.permissions = user.permissions || [];
    return next();
  } catch (error) {
    return next(error);
  }
};

export { verifyTokenExists, verifyUserRole };
