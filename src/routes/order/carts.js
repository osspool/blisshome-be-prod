// routes/carts.js
import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "#controllers/order/cartController.js";
import { protect } from "#middlewares/authMiddleware.js";
import { check, validationResult } from "express-validator";

const router = express.Router();

// All routes are protected
router.get("/", protect, getCart);

router.post(
  "/",
  protect,
  [
    check("productId", "Product ID is required").isMongoId(),
    check("variations", "Variations must be an array of objects")
      .optional()
      .isArray(),
    check("quantity", "Quantity must be an integer greater than 0").isInt({
      gt: 0,
    }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  addToCart
);

router.put(
  "/item/:itemId",
  protect,
  [
    check("quantity", "Quantity must be an integer greater than 0").isInt({
      gt: 0,
    }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateCartItem
);

router.delete("/item/:itemId", protect, removeCartItem);

router.delete("/", protect, clearCart);

export default router;
