// controllers/order/orderController.js
import Order from "#models/order/Order.js";
import User from "#models/User.js";
import mongoose from "mongoose";
import { createOrder as createOrderService } from "#src/services/orderService.js";


/**
 * @desc    Cancel an order
 * @route   DELETE /api/orders/:id
 * @access  Private/User/Admin
 */
export const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const { cancellationReason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const order = await Order.findById(id).populate("payment");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If the user is not admin, ensure they own the order
    if (
      req.user.role !== "admin" &&
      order.customer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Define cancellable statuses
    const cancellableStatuses = ["Pending", "Processing"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel order with status ${order.status}`,
      });
    }

    // Update order status and cancellation reason
    order.status = "Cancelled";
    order.cancellationReason = cancellationReason || "No reason provided";
    order.statusHistory.push({ status: "Cancelled" });
    await order.save();

    // Optionally, handle refund logic if payment was completed
    if (order.paymentStatus === "Completed" && order.payment) {
      // Implement refund logic here, e.g., interact with payment gateway API
      // After successful refund:
      order.payment.status = "Refunded";
      await order.payment.save();
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private/Customer
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id; 
    const orderData = req.body;

    const { order, paymentId, message } = await createOrderService(userId, orderData);

    res.status(201).json({
      order,
      paymentId,
      message,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};



/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private/User/Admin
 */
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const order = await Order.findById(id)
      .populate("customer", "name email")
      .populate({
        path: "couponApplied.coupon",
        select: "code discountType discountAmount",
      })
      .populate({
        path: "payment",
        populate: {
          path: "method",
          select: "name type",
        },
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If the user is not admin, ensure they own the order
    if (
      req.user.role !== "admin" &&
      order.customer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * @desc    Get user's own orders
 * @route   GET /api/orders/my-orders
 * @access  Private/User
 */
export const getUserOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { customer: req.user._id };

  if (status && status !== "all") {
    query.status = status;
  }

  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        {
          path: "payment",
          populate: { path: "method", select: "name type" },
        },
        {
          path: "couponApplied.coupon",
          select: "code discountType discountAmount",
        },
        { path: "items.product", select: "name" },
      ],
    };

    const orders = await Order.paginate(query, options);

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res) => {
  const { page = 1, limit = 10, status, paymentStatus, deliveryMethod, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  if (deliveryMethod) {
    query["delivery.method"] = deliveryMethod;
  }

  if (search) {
    if (mongoose.Types.ObjectId.isValid(search)) {
      query.$or = [
        { _id: mongoose.Types.ObjectId(search) },
        { customer: mongoose.Types.ObjectId(search) },
      ];
    } else {
      // Assuming search by customer email or name
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      query.customer = { $in: users.map((user) => user._id) };
    }
  }

  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        { path: "customer", select: "name email" },
        {
          path: "payment",
          populate: { path: "method", select: "name type" },
        },
        {
          path: "couponApplied.coupon",
          select: "code discountType discountAmount",
        },
        { path: "items.product", select: "name" },
      ],
    };

    const orders = await Order.paginate(query, options);

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};