import express from "express";
import trackingController from "./tracking.controller.js";
import trackingService from "./tracking.service.js";
import { trackingScope } from "./tracking.access.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Signed in, and each route needs the matching domain permission (see tracking.access.js):
// reads need view, add needs create, changes need edit, delete needs delete. Results are
// limited to the domains the caller holds that permission in.
router.use(verifyTokenExists);

const view = trackingScope("view");
const create = trackingScope("create");
const edit = trackingScope("edit");
const remove = trackingScope("delete");

// Keep the stored overdue flag current before anything is listed or counted.
const refreshOverdue = async (req, res, next) => {
  try {
    await trackingService.updateOverdueStatus();
  } catch (error) {
    console.error("Could not refresh overdue flags:", error.message);
  }
  next();
};

router.post("/", create, trackingController.createTracking);
router.get("/", view, refreshOverdue, trackingController.getAllTracking);
router.get("/stats", view, refreshOverdue, trackingController.getTrackingStats);
router.get("/urgent-cases", view, trackingController.getUrgentCases);
router.get("/urgent-cases/alerts", view, trackingController.getUrgentCaseAlerts);
router.get("/overdue", view, trackingController.getOverdueTracking);
router.get("/upcoming", view, trackingController.getUpcomingTracking);
router.get("/record/:recordType/:recordId", view, trackingController.getTrackingByRecord);
router.get("/history/:recordType/:recordId", view, trackingController.getMonthlyUpdateHistory);
router.get("/:id", view, trackingController.getTrackingById);

router.patch("/:id", edit, trackingController.updateTracking);
router.post("/:id/monthly-update", edit, trackingController.addMonthlyUpdate);
router.post("/:id/complete", edit, trackingController.completeTracking);
router.post("/:id/cancel", edit, trackingController.cancelTracking);

// Soft delete
router.delete("/:id", remove, trackingController.deleteTracking);

export default router;
