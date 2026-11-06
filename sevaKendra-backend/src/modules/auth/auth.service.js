import { generateToken } from "../../utils/auth.utils.js";
import User from "../user/user.model.js";
import { APIError } from "../../errors/apiError.js";

export const toPublicUser = (user) => ({
  id: user._id ?? user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  status: user.status,
  permissions: user.permissions || [],
});

/**
 * Login user. Unknown email, wrong password and inactive account give the same answer
 * until the password is proven, so the endpoint does not reveal which emails exist.
 */
export const login = async (credentials = {}) => {
  const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";

  if (!email || !password) {
    throw new APIError("Enter your email and password", 400);
  }

  const user = await User.findOne({ email });
  const isPasswordValid = user ? await user.passwordMatch(password) : false;
  if (!user || !isPasswordValid) {
    throw new APIError("Invalid email or password", 401);
  }

  if (user.status !== "active") {
    throw new APIError("Account is not active. Please contact administrator.", 403);
  }

  user.lastLogin = new Date();
  await user.save({ validateModifiedOnly: true });

  // The token carries identity only; role and permissions are re-read on every request.
  const token = await generateToken({ userId: user._id, v: user.tokenVersion || 0 });

  return { user: toPublicUser(user), token };
};
