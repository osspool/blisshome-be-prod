// routes/coupons.js
import express from "express";
import {
  getCoupons,
  getCouponByCode, // Import the new controller
  updateCoupon,
  deleteCoupon,
  createCoupon,
} from "#controllers/order/couponController.js";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { check, validationResult } from "express-validator";

const router = express.Router();

// Protected routes (Admin)
router.post(
  "/",
  protect,
  authorize("admin"),
  [
    check("code", "Code is required").not().isEmpty(),
    check(
      "discountType",
      "Discount type must be either percentage or fixed"
    ).isIn(["percentage", "fixed"]),
    check("discountAmount", "Discount amount must be a number").isFloat({
      gt: 0,
    }),
    check("expiresAt", "Valid expiration date is required").isISO8601(),
    // Add more validations as needed
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createCoupon
);

// Get all coupons (Protected)
router.get("/", protect, authorize('admin'), getCoupons);

// Get a single coupon by code
router.get(
  "/code/:code",
  protect, // Adjust middleware as needed
  authorize("admin"), // Remove or modify if non-admins should access
  [
    check("code", "Code is required").not().isEmpty().trim().toUpperCase(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  getCouponByCode
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    // Add validations if necessary
  ],
  updateCoupon
);

router.delete("/:id", protect, authorize("admin"), deleteCoupon);

export default router;