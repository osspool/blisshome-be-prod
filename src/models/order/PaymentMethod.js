// models/order/PaymentMethod.js
import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: function () {
        return this.type === "online";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
export default PaymentMethod;
