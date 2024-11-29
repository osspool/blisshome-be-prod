// middleware for payment methods
import { check, validationResult } from "express-validator";

/**
 * Validation rules for creating a payment method.
 */
export const validateCreatePaymentMethod = [
  check("name", "Name is required").notEmpty(),
  check("type", "Type must be either online or offline")
    .isIn(["online", "offline"]),
  // 'details' is required only if type is 'online'
  check("details")
    .if((value, { req }) => req.body.type === "online")
    .notEmpty()
    .withMessage("Details are required for online payment methods"),
  check("details")
    .optional()
    .isObject()
    .withMessage("Details must be an object"),
  check("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  // Additional dynamic validations can be added here based on 'type'
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

/**
 * Validation rules for updating a payment method.
 */
export const validateUpdatePaymentMethod = [
  check("name")
    .optional()
    .notEmpty()
    .withMessage("Name cannot be empty"),
  check("type")
    .optional()
    .isIn(["online", "offline"])
    .withMessage("Type must be either online or offline"),
  // 'details' is required only if type is 'online'
  check("details")
    .if((value, { req }) => req.body.type === "online")
    .notEmpty()
    .withMessage("Details are required for online payment methods"),
  check("details")
    .optional()
    .isObject()
    .withMessage("Details must be an object"),
  check("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  // Additional dynamic validations can be added here based on 'type'
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
