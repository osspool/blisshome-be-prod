// routes/products.js
import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "#controllers/product/productController.js";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import upload from "#config/multer.js";
import { check, validationResult } from "express-validator";
import { addReview } from "#controllers/product/reviewController.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Add a review to a product
router.post(
  "/:id/reviews",
  protect,
  authorize("customer"),
  [
    check("rating", "Rating is required and must be between 1 and 5").isInt({
      min: 1,
      max: 5,
    }),
    // Optional: Validate 'comment' if needed
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  addReview
);

// Protected routes (admin/staff)
router.post(
  "/",
  protect,
  authorize("admin", "staff"),
  upload.array("images", 4),
  [
    check("name", "Name is required").not().isEmpty(),
    check("basePrice", "Base price must be a number").isFloat({ gt: 0 }),
    check("quantity", "Quantity must be an integer").isInt({ gt: 0 }),
    check("category", "Category ID is required").isMongoId(),
    // Add more validations as needed
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createProduct
);

router.put(
  "/:id",
  protect,
  authorize("admin", "staff"),
  upload.array("images", 4),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateProduct
);

router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;
