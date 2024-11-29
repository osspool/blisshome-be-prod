// controllers/order/orderController.js
import Order from "#models/order/Order.js";
import Cart from "#models/order/Cart.js";
import Product from "#models/product/Product.js";
import User from "#models/User.js";
import DeliveryPricing from "#models/order/DeliveryPricing.js";
import mongoose from "mongoose";
import { calculateDiscount } from "#services/discountService.js";
import { getDeliveryAddress } from "#services/addressService.js";
import { createPayment } from "#services/paymentService.js";



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
  const {
    deliveryMethodId,
    deliveryAddressId,
    useSavedAddress,
    couponCode,
    paymentType,
    paymentMethodId, // Optional for online payments
    paymentMethodName,
    metaData,
    manualAddress, // New field for manual address
  } = req.body;

  try {
    // Fetch cart
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Fetch user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get delivery address
    const deliveryAddress = await getDeliveryAddress(
      user,
      useSavedAddress,
      deliveryAddressId,
      manualAddress
    );

    // Fetch delivery pricing rule based on deliveryMethod
    const deliveryRule = await DeliveryPricing.findById(deliveryMethodId);
    if (!deliveryRule) {
      return res.status(400).json({ message: "Invalid delivery method" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (let item of cart.items) {
      const product = item.product;
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient quantity for product ${product.name}`,
        });
      }

      // Calculate price with variation modifiers
      let itemPrice = product.basePrice;
      if (item.variations && Array.isArray(item.variations)) {
        for (let variation of item.variations) {
          const { name, option } = variation;
          const productVariation = product.variations.find(
            (v) => v.name === name
          );
          if (productVariation) {
            const productOption = productVariation.options.find(
              (o) => o.value === option.value
            );
            if (productOption && productOption.priceModifier) {
              itemPrice += productOption.priceModifier;
            }
          }
        }
      }

      totalAmount += itemPrice * item.quantity;

      orderItems.push({
        product: product._id,
        productName: product.name,
        variations: item.variations, // Optional
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    // Apply delivery price
    totalAmount += deliveryRule.price;

    // Apply coupon if provided
    let couponApplied = null;
    if (couponCode) {
      const { coupon, discountType, discountAmount } = await calculateDiscount(
        couponCode,
        totalAmount
      );

      couponApplied = {
        coupon: coupon._id,
        code: coupon.code,
        discountType,
        discountAmount,
      };

      totalAmount -= discountAmount; // Adjust totalAmount based on discount
    }

    // Create order object without payment details
    let order = new Order({
      customer: req.user.id,
      items: orderItems,
      totalAmount,
      delivery: {
        method: deliveryRule.name,
        price: deliveryRule.price,
        estimatedDays: deliveryRule.estimatedDays,
      },
      status: "Pending",
      paymentType,
      paymentStatus: "Pending",
      deliveryDetails: {
        address: deliveryAddress, // Already formatted in getDeliveryAddress
        method: deliveryRule.method,
      },
      couponApplied,
    });

    order.statusHistory.push({ status: "Pending" });

    const createdOrder = await order.save();

     // Update User statistics
    user.totalOrders += 1;
    user.totalPurchases += totalAmount;

    // Create a Payment record if paymentType is online
    let createdPayment = null;
    if (paymentType === "online") { // Assuming paymentMethodId is sent in the body
      createdPayment = await createPayment({
        orderId: createdOrder._id,
        customerId: req.user.id,
        paymentMethodId, // May be undefined if not provided
        metaData,
        paymentMethodName
      });
    } else if (paymentType === "offline") {
      // For offline payments, create a Payment record with "COD"
      createdPayment = await createPayment({
        orderId: createdOrder._id,
        customerId: req.user.id,
        paymentMethodName: "COD",
      });
    } else {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    // Link Payment to Order
    createdOrder.payment = createdPayment._id;
    await createdOrder.save();

    // Deduct product quantities using bulkWrite for efficiency
    const bulkOperations = cart.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product._id },
        update: { $inc: { quantity: -item.quantity } },
      },
    }));

    await Product.bulkWrite(bulkOperations);

    // Clear user's cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      order: createdOrder,
      paymentId: createdPayment ? createdPayment._id : null, // Return payment ID for redirection if online
      message:
        paymentType === "online"
          ? "Order created."
          : "Order created with Cash on Delivery (COD).",
    });
  } catch (error) {
    console.error(error);
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