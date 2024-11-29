// routes/adminDashboard.js
import express from "express";
import {
  getTotalSales,
  getSalesByRegion,
  getTopProducts,
  getActiveCoupons,
} from "../controllers/adminDashboardController.js";
import { protect, authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// All routes are protected and require admin role
router.get("/total-sales", protect, authorize("admin"), getTotalSales);
router.get("/sales-by-region", protect, authorize("admin"), getSalesByRegion);
router.get("/top-products", protect, authorize("admin"), getTopProducts);
router.get("/active-coupons", protect, authorize("admin"), getActiveCoupons);

export default router;
