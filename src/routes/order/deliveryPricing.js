// routes/deliveryPricing.js
import express from "express";
import {
  createDeliveryPricing,
  getDeliveryPricing,
  updateDeliveryPricing,
  deleteDeliveryPricing,
} from "#controllers/order/deliveryPricingController.js";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { check, validationResult } from "express-validator";

const router = express.Router();

// Protected routes (Admin)
router.post(
  "/",
  protect,
  authorize("admin"),
  [
    check("name", "Name is required").not().isEmpty(),
    check("region", "Region is required").not().isEmpty(),
    check("price", "Price must be a number").isFloat({ gt: 0 }),
    // Add more validations as needed
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createDeliveryPricing
);

router.get("/", protect, getDeliveryPricing);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    // Add validations if necessary
  ],
  updateDeliveryPricing
);

router.delete("/:id", protect, authorize("admin"), deleteDeliveryPricing);

export default router;
