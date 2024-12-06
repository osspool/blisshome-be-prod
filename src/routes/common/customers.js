// routes/customers.js
import express from "express";
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getTopCustomers,
} from "#controllers/admin/customerController.js";
import { protect, authorize } from "../../middlewares/authMiddleware.js";
import { check, validationResult } from "express-validator";

const router = express.Router();

// Get all customers with pagination and search
router.get("/", protect, authorize("admin"), getCustomers);
router.get("/top", protect, authorize("admin"), getTopCustomers);

// Get single customer by ID
router.get("/:id", protect, authorize("admin"), getCustomerById);

// Update a customer
router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    // Add validations if necessary
  ],
  updateCustomer
);

// Delete a customer
router.delete("/:id", protect, authorize("admin"), deleteCustomer);

export default router;
