// routes/landingPage.js
import express from "express";
import {
  getLandingPage,
  updateLandingPage,
} from "#controllers/admin/landingPageController.js";
import { protect, authorize } from "../../middlewares/authMiddleware.js";
import multer from "multer";

// Configure multer storage (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// @route   GET /api/landing-page
// @desc    Get the landing page configuration
// @access  Public
router.get("/", getLandingPage);

// @route   PUT /api/landing-page
// @desc    Update the landing page configuration
// @access  Private/Admin
router.put(
  "/",
  protect,
  authorize("admin"),
  upload.any(), // Allow multiple file uploads
  updateLandingPage
);

export default router;
