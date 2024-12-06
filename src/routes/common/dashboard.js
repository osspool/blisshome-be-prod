import express from "express";
import { getDashboardSummary } from "#src/controllers/admin/dashboardController.js";
import { authorize, protect } from "#src/middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize('admin'), getDashboardSummary);

export default router;