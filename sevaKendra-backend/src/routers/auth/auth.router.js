import express from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../../modules/auth/auth.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";

const router = express.Router();

// 50 failed sign-ins per IP per 15 minutes (a field office shares one connection), and
// 10 per account below. Accounts are created by an admin; there is no public sign-up.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." },
});

// Also per account, so changing IP addresses does not allow guessing one user's password.
const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `account:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: { success: false, message: "Too many sign-in attempts for this account. Please wait 15 minutes and try again." },
});

router.post("/login", loginLimiter, accountLimiter, authController.login);
router.post("/logout", verifyTokenExists, authController.logout);
router.get("/verify", verifyTokenExists, authController.verifyToken);

export default router;
