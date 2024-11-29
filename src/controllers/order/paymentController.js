// controllers/paymentController.js
import Payment from "#models/order/Payment.js";
import Order from "#models/order/Order.js";
import PaymentMethod from "#models/order/PaymentMethod.js";
import { updatePaymentStatus as  updatePaymentStatusService } from "#src/services/paymentService.js";
import mongoose from "mongoose";
// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private/Customer
export const getPaymentDetails = async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findById(paymentId).populate("method");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Ensure the payment belongs to the requesting user
    if (payment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update payment status
// @route   PUT /api/payments/:paymentId
// @access  Private/Admin
export const updatePaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res.status(400).json({ message: "Invalid payment ID" });
  }

  // Validate status
  const validStatuses = ["Pending", "Completed", "Failed", "Refunded"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }

  try {
    // Use the service to update payment status
    const updatedPayment = await updatePaymentStatusService(paymentId, status);

    res.json({ message: "Payment updated successfully", payment: updatedPayment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};



// @desc    Create a payment record
// @route   POST /api/payments
// @access  Private/User
export const createPayment = async (req, res) => {
  const { orderId, paymentMethodId, metadata } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(paymentMethodId)) {
    return res.status(400).json({ message: "Invalid order or payment method ID" });
  }

  try {
    const order = await Order.findById(orderId).populate("payment");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the order belongs to the user
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Prevent creating a new payment if one already exists
    if (order.payment) {
      return res.status(400).json({ message: "Payment already exists for this order" });
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod || !paymentMethod.isActive) {
      return res.status(400).json({ message: "Invalid or inactive payment method" });
    }

    // Create payment record
    const payment = new Payment({
      order: order._id,
      customer: req.user._id,
      method: paymentMethod._id,
      paymentMethodName: paymentMethod.name,
      metadata,
    });

    const createdPayment = await payment.save();

    // Associate payment with order
    order.payment = createdPayment._id;
    await order.save();

    res.status(201).json(createdPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// webhook for gateways later
// @desc    Handle payment webhook
// @route   POST /api/payments/webhook
// @access  Public (secured via secret or signature)
export const paymentWebhook = async (req, res) => {
    const { paymentId, status, transactionId } = req.body;
  
    try {
      const payment = await Payment.findById(paymentId).populate("order");
  
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
  
      payment.status = status;
      payment.transactionId = transactionId;
      if (status === "Completed") {
        payment.paymentDate = new Date();
        payment.order.paymentStatus = "Completed";
      } else if (status === "Failed") {
        payment.order.paymentStatus = "Failed";
      }
      await payment.save();
      await payment.order.save();
  
      res.status(200).json({ message: "Payment status updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };