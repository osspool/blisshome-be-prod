// middleware/validationMiddleware.js
import { check, validationResult } from "express-validator";

/**
 * Validation rules for creating an order.
 */
export const validateCreateOrder = [
  check("deliveryMethodId", "Delivery method is required").notEmpty(),
  check("useSavedAddress")
    .isBoolean()
    .withMessage("useSavedAddress must be a boolean"),
  check("paymentType")
    .isIn(["online", "offline"])
    .withMessage("Payment type must be either online or offline"),
  // If useSavedAddress is true, deliveryAddressId is required
  check("deliveryAddressId")
    .if((value, { req }) => req.body.useSavedAddress)
    .notEmpty()
    .withMessage("deliveryAddressId is required when useSavedAddress is true"),
  // If useSavedAddress is false, manualAddress is required
  check("manualAddress")
    .if((value, { req }) => !req.body.useSavedAddress)
    .notEmpty()
    .withMessage("manualAddress is required when useSavedAddress is false"),
  // Optional: Validate couponCode, manualAddress fields, etc.
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];


export const validateUpdateOrderStatus = [
  check("status", "Status is required and must be valid.")
    .isIn(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]),
  check("remarks")
    .optional()
    .isString()
    .withMessage("Remarks must be a string."),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];