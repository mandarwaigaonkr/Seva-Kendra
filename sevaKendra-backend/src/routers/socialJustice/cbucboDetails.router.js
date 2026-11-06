import { Router } from "express";
import {
  createCBUCBODetails,
  getAllCBUCBODetails,
  getCBUCBODetailsById,
  updateCBUCBODetails,
  deleteCBUCBODetails,
  getCBUCBODetailsStats,
  getCBUCBODetailsByWard,
  getCBUCBODetailsByHabitation,
  getCBUCBODetailsByGroupType,
  getCBUCBODetailsByStatus,
} from "../../modules/socialJustice/controllers/cbucboDetails.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

const router = Router();

// CRUD routes
router.post(
  "/",
  verifyTokenExists,
  checkPermission("socialJustice", "create"),
  createAutoFollowUp("CBUCBODetails"),
  createCBUCBODetails
);
router.get("/", verifyTokenExists, checkPermission("socialJustice", "view"), getAllCBUCBODetails);
router.get("/stats", verifyTokenExists, checkPermission("socialJustice", "view"), getCBUCBODetailsStats);
router.get("/:id", verifyTokenExists, checkPermission("socialJustice", "view"), getCBUCBODetailsById);
router.put("/:id", verifyTokenExists, checkPermission("socialJustice", "edit"), updateCBUCBODetails);
router.delete("/:id", verifyTokenExists, checkPermission("socialJustice", "delete"), closeFollowUpsOnDelete("CBUCBODetails"), deleteCBUCBODetails);

// Filter routes
router.get("/ward/:wardNo", verifyTokenExists, checkPermission("socialJustice", "view"), getCBUCBODetailsByWard);
router.get(
  "/habitation/:habitation",
  verifyTokenExists,
  checkPermission("socialJustice", "view"),
  getCBUCBODetailsByHabitation
);
router.get(
  "/group-type/:groupType",
  verifyTokenExists,
  checkPermission("socialJustice", "view"),
  getCBUCBODetailsByGroupType
);
router.get("/status/:status", verifyTokenExists, checkPermission("socialJustice", "view"), getCBUCBODetailsByStatus);

// Special action routes

// Sub-item endpoints (members, participants, interventions, progress reports, ...) were
// removed: they wrote to arrays these models do not have, and no screen used them.
export default router;
