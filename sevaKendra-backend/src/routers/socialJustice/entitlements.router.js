import { Router } from "express";
import {
  createEntitlements,
  getAllEntitlements,
  getEntitlementsById,
  updateEntitlements,
  deleteEntitlements,
  getEntitlementsStats,
  getEntitlementsByWard,
  getEntitlementsByHabitation,
  getEntitlementsByStatus,
  getEntitlementsByIdProofType,
  getEntitlementsByScheme,
} from "../../modules/socialJustice/controllers/entitlements.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

const router = Router();

// CRUD routes
router.post(
  "/",
  verifyTokenExists, checkPermission("socialJustice", "create"),
  createAutoFollowUp("Entitlements"),
  createEntitlements
);
router.get("/", verifyTokenExists, checkPermission("socialJustice", "view"), getAllEntitlements);
router.get("/stats", verifyTokenExists, checkPermission("socialJustice", "view"), getEntitlementsStats);
router.get("/:id", verifyTokenExists, checkPermission("socialJustice", "view"), getEntitlementsById);
router.put("/:id", verifyTokenExists, checkPermission("socialJustice", "edit"), updateEntitlements);
router.delete("/:id", verifyTokenExists, checkPermission("socialJustice", "delete"), closeFollowUpsOnDelete("Entitlements"), deleteEntitlements);

// Filter routes
router.get("/ward/:wardNo", verifyTokenExists, checkPermission("socialJustice", "view"), getEntitlementsByWard);
router.get(
  "/habitation/:habitation",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getEntitlementsByHabitation
);
router.get(
  "/status/:applicationStatus",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getEntitlementsByStatus
);
router.get(
  "/id-proof/:idProofType",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getEntitlementsByIdProofType
);
router.get("/scheme/:schemeName", verifyTokenExists, checkPermission("socialJustice", "view"), getEntitlementsByScheme);

// Special action routes

// Sub-item endpoints (members, participants, interventions, progress reports, ...) were
// removed: they wrote to arrays these models do not have, and no screen used them.
export default router;
