// models/MonthlySummary.js
import mongoose from "mongoose";

const monthlySummarySchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number, // 1-12 representing January to December
      required: true,
      min: 1,
      max: 12,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    statusCounts: {
      Pending: { type: Number, default: 0 },
      Processing: { type: Number, default: 0 },
      Shipped: { type: Number, default: 0 },
      Delivered: { type: Number, default: 0 },
      Cancelled: { type: Number, default: 0 },
    },
    paymentStatusCounts: {
      Pending: { type: Number, default: 0 },
      Completed: { type: Number, default: 0 },
      Failed: { type: Number, default: 0 },
      Refunded: { type: Number, default: 0 },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { timestamps: true }
);

// Ensure combination of year and month is unique
monthlySummarySchema.index({ year: 1, month: 1 }, { unique: true });

const MonthlySummary = mongoose.model("MonthlySummary", monthlySummarySchema);
export default MonthlySummary;
