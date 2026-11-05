import { Router } from "express";
const router = Router();
import tbhivAddictController from "../../modules/health/controllers/tbhivAddict.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), tbhivAddictController.getAllTBHIVAddict);
router.get(
  "/stats",
  verifyTokenExists, checkPermission("health", "view"),
  tbhivAddictController.getTBHIVAddictStats
);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), tbhivAddictController.getTBHIVAddictById);
router.post("/", verifyTokenExists, checkPermission("health", "create"), tbhivAddictController.createTBHIVAddict);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), tbhivAddictController.updateTBHIVAddict);
router.delete(
  "/:id",
  verifyTokenExists, checkPermission("health", "delete"),
  tbhivAddictController.deleteTBHIVAddict
);

export default router;
