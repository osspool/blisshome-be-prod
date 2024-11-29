// routes/orders.js
import express from "express";
import {
  createOrder,
  getOrderById,
  getAllOrders,
  getUserOrders,
  cancelOrder,
} from "#controllers/order/orderController.js";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { validateCreateOrder, validateUpdateOrderStatus } from "#validators/orders.js";
import { updateOrderStatus, deleteOrder } from "#controllers/order/adminOrderController.js";

const router = express.Router();

// Create a new order (Customer)
router.post("/", protect, validateCreateOrder, createOrder);
// Get All Orders (Admin)
router.get("/", protect, authorize("admin"), getAllOrders);
// Get User's Orders
router.get("/my-orders", protect, getUserOrders);
// Get Order By ID
router.get("/:id", protect, getOrderById);
// Cancel Order
router.delete("/cancel/:id", protect, cancelOrder);

router.delete("/:id", protect, authorize("admin"), deleteOrder);
// admin routes
router.put("/:id/status", protect, authorize("admin"), validateUpdateOrderStatus, updateOrderStatus);


export default router;