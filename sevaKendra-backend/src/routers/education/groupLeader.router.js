import { Router } from "express";
const router = Router();
import groupLeaderController from "../../modules/education/controllers/groupLeader.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";

// Routes with authentication
router.get("/dropdown", verifyTokenExists, checkPermission("education", "view"), groupLeaderController.getGroupLeadersDropdown);
router.get("/stats", verifyTokenExists, checkPermission("education", "view"), groupLeaderController.getGroupLeadersStats);
router.get("/filter-options", verifyTokenExists, checkPermission("education", "view"), groupLeaderController.getFilterOptions);
router.get("/", verifyTokenExists, checkPermission("education", "view"), groupLeaderController.getAllGroupLeaders);
router.get("/:id", verifyTokenExists, checkPermission("education", "view"), groupLeaderController.getGroupLeaderById);
router.post("/", verifyTokenExists, checkPermission("education", "create"), groupLeaderController.createGroupLeader);
router.put("/:id", verifyTokenExists, checkPermission("education", "edit"), groupLeaderController.updateGroupLeader);
router.delete("/:id", verifyTokenExists, checkPermission("education", "delete"), groupLeaderController.deleteGroupLeader);

export default router;
