// models/order/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    method: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: function () {
        // Required only if not COD
        return this.paymentMethodName !== "COD";
      },
    },
    paymentMethodName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentDate: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    verified: { // New field
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ customer: 1, status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
