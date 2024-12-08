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
    const order = await Order.findById(id).populate("payment").populate("customer");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If the user is not admin, ensure they own the order
    if (
      req.user.role !== "admin" &&
      order.customer._id.toString() !== req.user._id.toString()
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

    // Update user statistics
    const user = await User.findById(order.customer._id);
    if (user) {
      user.cancelledOrders += 1;

      // Optionally adjust totalPurchases
      // Depending on your business logic, you might want to subtract the order's totalAmount
      // For example:
      user.totalPurchases -= order.totalAmount;

      // Ensure totalPurchases doesn't go negative
      if (user.totalPurchases < 0) {
        user.totalPurchases = 0;
      }

      await user.save();
    }

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
  try {
    // Destructure and parse query parameters with defaults
    let { page = 1, limit = 10, status, paymentStatus, search } = req.query;

    // Convert page and limit to integers and validate
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    // Initialize the query object
    const query = {};

    // Define allowed status and paymentStatus values based on the Order model enums
    const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    const allowedPaymentStatuses = ["Pending", "Completed", "Failed", "Refunded"];

    // Add status to query if it's provided and not 'All'
    if (status && status !== "All") {
      if (allowedStatuses.includes(status)) {
        query.status = status;
      } else {
        return res.status(400).json({ message: "Invalid status value" });
      }
    }

    // Add paymentStatus to query if it's provided and not 'All'
    if (paymentStatus && paymentStatus !== "All") {
      if (allowedPaymentStatuses.includes(paymentStatus)) {
        query.paymentStatus = paymentStatus;
      } else {
        return res.status(400).json({ message: "Invalid paymentStatus value" });
      }
    }

    // console.log("Query", query);

    // Handle search functionality
    if (search) {
      const searchQuery = {};

      if (mongoose.Types.ObjectId.isValid(search)) {
        // If search is a valid ObjectId, search by _id or customer ID
        searchQuery.$or = [
          { _id: mongoose.Types.ObjectId(search) },
          { customer: mongoose.Types.ObjectId(search) },
        ];
      } else {
        // Search by customer name or email using case-insensitive regex
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }).select("_id");

        if (users.length > 0) {
          const userIds = users.map((user) => user._id);
          searchQuery.customer = { $in: userIds };
        } else {
          // If no users match the search, ensure no orders are returned
          searchQuery.customer = { $in: [] };
        }
      }

      // Merge searchQuery into the main query
      Object.assign(query, searchQuery);
    }

    // Define pagination and population options
    const options = {
      page,
      limit,
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
      lean: true, // Returns plain JavaScript objects instead of Mongoose documents
      leanWithId: false,
    };

    // Execute the paginated query
    const orders = await Order.paginate(query, options);

    // Respond with the paginated orders
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
};