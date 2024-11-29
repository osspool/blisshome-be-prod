// services/paymentService.js
import Payment from "#models/order/Payment.js";
import Order from "#models/order/Order.js";
import PaymentMethod from "#models/order/PaymentMethod.js";


/**
 * Creates a Payment record for the given order.
 * @param {Object} params - Payment details.
 * @param {String} params.orderId - The order ID.
 * @param {String} params.customerId - The customer ID.
 * @param {String} [params.paymentMethodId] - The payment method ID (optional for COD).
 * @param {String} params.paymentMethodName - The payment method name.
 * @returns {Object} - Created Payment object.
 * @throws {Error} - If payment method validation fails.
 */
export const createPayment = async ({
  orderId,
  customerId,
  paymentMethodId,
  paymentMethodName,
}) => {
  const paymentData = {
    order: orderId,
    customer: customerId,
    paymentMethodName,
  };

  if (paymentMethodName !== "COD") {
    if (!paymentMethodId) {
      throw new Error("Payment method ID is required for online payments");
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod || !paymentMethod.isActive) {
      throw new Error("Invalid or inactive payment method");
    }

    paymentData.method = paymentMethod._id;
    paymentData.verified = false; // For online payments
  } else {
    paymentData.verified = true; // For COD
  }

  const payment = new Payment(paymentData);
  await payment.save();
  return payment;
};


/**
 * Updates the status of a Payment record.
 * @param {String} paymentId - The payment ID.
 * @param {String} status - The new status ("Pending", "Completed", "Failed").
 * @param {String} [transactionId] - The transaction ID (optional).
 * @returns {Object} - Updated Payment object.
 * @throws {Error} - If payment not found or invalid status.
 */
export const updatePaymentStatus = async (paymentId, status, transactionId = null) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  payment.status = status;
  if (transactionId) {
    payment.transactionId = transactionId;
  }
  if (status === "Completed") {
    payment.paymentDate = new Date();
    payment.verified = true; // Mark as verified
    // Also update the corresponding order's paymentStatus
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = "Completed";
      await order.save();
    }
  }

  await payment.save();
  return payment;
};

// Mock function to simulate bKash payment processing
const processBkashPayment = async (details) => {
  // In a real scenario, integrate with bKash API
  // For now, we'll simulate a successful payment
  return {
    success: true,
    transactionId: "BKASH123456789",
    message: "Payment successful",
  };
};

// Mock function for Cash on Delivery (no immediate processing)
const processCODPayment = async (details) => {
  return {
    success: true,
    transactionId: null,
    message: "Payment to be made on delivery",
  };
};

// Future payment gateway integration (e.g., SSLCommerz)
const processGatewayPayment = async (details) => {
  // Placeholder for future implementation
  return {
    success: false,
    transactionId: null,
    message: "Payment gateway not implemented",
  };
};

export const handlePayment = async (paymentId, paymentData) => {
  const payment = await Payment.findById(paymentId).populate("order");

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Example: Integrate with a payment gateway
  // const gatewayResponse = await paymentGateway.process(paymentData);

  // For demonstration, let's assume the payment is completed
  payment.status = "Completed";
  payment.transactionId = paymentData.transactionId || "txn_123456789";
  payment.paymentDate = new Date();
  await payment.save();

  // Update order payment status
  const order = await Order.findById(payment.order);
  if (order) {
    order.paymentStatus = "Completed";
    await order.save();
  }

  return payment;
};