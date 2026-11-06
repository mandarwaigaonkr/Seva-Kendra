import { Router } from "express";
const router = Router();
import dropoutController from "../../modules/education/controllers/dropout.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes
router.get("/", verifyTokenExists, checkPermission("education", "view"), dropoutController.getAllDropouts);
router.get("/stats", verifyTokenExists, checkPermission("education", "view"), dropoutController.getDropoutsStats);
router.get(
  "/filter-options",
  verifyTokenExists, checkPermission("education", "view"),
  dropoutController.getFilterOptions
);
router.get("/:id", verifyTokenExists, checkPermission("education", "view"), dropoutController.getDropoutById);
router.post(
  "/",
  verifyTokenExists, checkPermission("education", "create"),
  createAutoFollowUp("Dropouts"),
  dropoutController.createDropout
);
router.put("/:id", verifyTokenExists, checkPermission("education", "edit"), dropoutController.updateDropout);
router.delete("/:id", verifyTokenExists, checkPermission("education", "delete"), closeFollowUpsOnDelete("Dropouts"), dropoutController.deleteDropout);

export default router;
