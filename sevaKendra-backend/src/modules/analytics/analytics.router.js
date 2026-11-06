import express from "express";
import analyticsController from "./analytics.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkAnyPermission } from "../../middleware/permissionMiddleware.js";

const router = express.Router();

// All analytics routes require authentication
router.use(verifyTokenExists);
// Dashboard figures are counts across all domains: any domain view permission is enough.
router.use(
  checkAnyPermission([
    ["health", "view"],
    ["education", "view"],
    ["socialJustice", "view"],
  ])
);

// Get complete dashboard data (all endpoints combined)
router.get("/dashboard", analyticsController.getCompleteDashboard);

// Individual analytics endpoints
router.get("/overview", analyticsController.getDashboardOverview);
router.get("/monthly-trends", analyticsController.getMonthlyTrends);
router.get("/gender-distribution", analyticsController.getGenderDistribution);
router.get("/age-distribution", analyticsController.getAgeDistribution);
router.get("/module-distribution", analyticsController.getModuleDistribution);
router.get("/status-distribution", analyticsController.getStatusDistribution);
router.get("/recent-activities", analyticsController.getRecentActivities);
router.get("/quick-insights", analyticsController.getQuickInsights);

export default router;
