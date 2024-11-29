// routes/categories.js
import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "#controllers/product/categoryController.js";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import upload from "#config/multer.js"; // Import the pre-configured multer
import { validateCreateCategory, validateUpdateCategory } from "#validators/categories.js";
import { handleValidationErrors } from "#middlewares/validateRequest.js";


const router = express.Router();



// Public Routes
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Protected Routes (Admin)
// Create Category Route
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"), // Use the imported multer middleware
  validateCreateCategory,
  handleValidationErrors,
  createCategory
);


router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"), // Use the imported multer middleware
  validateUpdateCategory,
  handleValidationErrors,
  updateCategory
);

router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;
