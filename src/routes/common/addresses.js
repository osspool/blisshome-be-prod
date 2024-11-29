// routes/addresses.js
import express from "express";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../../controllers/admin/addressController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { check, validationResult } from "express-validator";

const router = express.Router();

// All routes are protected
router.get("/", protect, getAddresses);

router.post(
  "/",
  protect,
  [
    check("label", "Label is required").not().isEmpty(),
    check("addressLine1", "Address Line 1 is required").not().isEmpty(),
    check("city", "City is required").not().isEmpty(),
    check("postalCode", "Postal Code is required").not().isEmpty(),
    check("country", "Country is required").not().isEmpty(),
    check("phone", "Phone number is required").not().isEmpty(),
    // Add more validations as needed
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  addAddress
);

router.put(
  "/:addressId",
  protect,
  [
    // Add validations if necessary
  ],
  updateAddress
);

router.delete("/:addressId", protect, deleteAddress);

export default router;
