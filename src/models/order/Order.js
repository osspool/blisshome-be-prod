// models/Order.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true }, // Embedded field
    variations: [
      {
        name: { type: String, required: true },
        option: {
          value: { type: String, required: true },
          priceModifier: { type: Number, default: 0 },
        },
      },
    ],
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true },
  },
  { _id: true } // Keeping _id for order items
);

const deliveryPricingSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedDays: { type: Number },
  },
  { _id: false }
);

const deliveryDetailsSchema = new mongoose.Schema(
  {
    address: {
      label: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    method: String,
  },
  { _id: false }
);

// These will ensure even if coupon is deleted they will be there in the order data.
const couponAppliedSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    code: { type: String },
    discountType: { type: String, enum: ["percentage", "fixed"] },
    discountAmount: { type: Number },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      required: true,
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    delivery: deliveryPricingSchema,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    statusHistory: [statusHistorySchema],
    paymentType: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    deliveryDetails: deliveryDetailsSchema,
    couponApplied: couponAppliedSchema,
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    cancellationReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ customer: 1, status: 1 });

// Plugin for pagination
orderSchema.plugin(mongoosePaginate);

const Order = mongoose.model("Order", orderSchema);
export default Order;
