// routes/paymentMethodRoutes.js
import express from "express";
import {
  createPaymentMethod,
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  deActivatePaymentMethod
} from "#controllers/order/paymentMethodController.js";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { validateCreatePaymentMethod, validateUpdatePaymentMethod } from "#validators/paymentMethod.js";

const router = express.Router();

/**
 * @route   POST /api/payment-methods
 * @desc    Create a new payment method
 * @access  Private/Admin
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  validateCreatePaymentMethod,
  createPaymentMethod
);

/**
 * @route   GET /api/payment-methods
 * @desc    Get all payment methods
 * @access  Public/User/Admin
 */
router.get("/", protect, getAllPaymentMethods);

/**
 * @route   GET /api/payment-methods/:id
 * @desc    Get a payment method by ID
 * @access  Public/User/Admin
 */
router.get("/:id", protect, getPaymentMethodById);

/**
 * @route   PUT /api/payment-methods/:id
 * @desc    Update a payment method
 * @access  Private/Admin
 */
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validateUpdatePaymentMethod,
  updatePaymentMethod
);

/**
 * @route   DELETE /api/payment-methods/:id
 * @desc    Delete a payment method (soft delete)
 * @access  Private/Admin
 */
router.delete("/:id", protect, authorize("admin"), deletePaymentMethod);

// deactivate  hard
router.delete("/deactivate/:id", protect, authorize("admin"), deActivatePaymentMethod);

export default router;
