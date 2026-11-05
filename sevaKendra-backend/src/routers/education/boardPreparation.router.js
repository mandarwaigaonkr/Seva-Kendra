import { Router } from "express";
const router = Router();
import boardPreparationController from "../../modules/education/controllers/boardPreparation.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp } from "../../middleware/autoTracking.middleware.js";

// Routes
router.get(
  "/",
  verifyTokenExists, checkPermission("education", "view"),
  boardPreparationController.getAllBoardPreparations
);
router.get(
  "/stats",
  verifyTokenExists, checkPermission("education", "view"),
  boardPreparationController.getBoardPreparationsStats
);
router.get(
  "/filter-options",
  verifyTokenExists, checkPermission("education", "view"),
  boardPreparationController.getFilterOptions
);
router.get(
  "/:id",
  verifyTokenExists, checkPermission("education", "view"),
  boardPreparationController.getBoardPreparationById
);
router.post(
  "/",
  verifyTokenExists, checkPermission("education", "create"),
  createAutoFollowUp("BoardPreparation"),
  boardPreparationController.createBoardPreparation
);
router.put(
  "/:id",
  verifyTokenExists, checkPermission("education", "edit"),
  boardPreparationController.updateBoardPreparation
);
router.delete(
  "/:id",
  verifyTokenExists, checkPermission("education", "delete"),
  boardPreparationController.deleteBoardPreparation
);

export default router;
