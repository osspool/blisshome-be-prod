// controllers/order/adminOrderController.js
import Order from "#models/order/Order.js";
import Payment from "#src/models/order/Payment.js";
import mongoose from "mongoose";
import { updatePaymentStatus as updatePaymentStatusService } from "#src/services/paymentService.js";

export const deleteOrder = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    await order.deleteOne();

    res.json({ message: "Order deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
}


/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  // Validate status
  const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }

  try {
    const order = await Order.findById(id).populate("payment");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // If not admin, deny access (redundant if route is protected properly)
    // Assuming role check is already handled by middleware

    // Optional: Check payment verification before proceeding
    // if (order.payment) {
    //   const payment = await Payment.findById(order.payment);
    //   if (order.paymentType === "online" && !payment.verified) {
    //     return res.status(400).json({ message: "Payment not verified yet. Cannot update order status." });
    //   }
    // }

    // Update status and add to statusHistory
    order.status = status;
    order.statusHistory.push({ status });

    // Additional logic based on status
    if (status === "Cancelled") {
      order.cancellationReason = remarks || "Order cancelled by admin.";
      
      // Handle refund logic if payment was completed
      if (order.payment && order.payment.status === "Completed") {
        // Use the payment service to handle the refund
        await updatePaymentStatusService(order.payment, "Refunded", null);
      }
    }

    await order.save();

    res.json({ message: "Order status updated successfully.", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};