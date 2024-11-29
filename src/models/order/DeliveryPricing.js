// models/DeliveryPricing.js
import mongoose from "mongoose";

const deliveryPricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "Dhaka City", "Outside Dhaka"
    region: { type: String, required: true }, // e.g., "Dhaka City", "Outside Dhaka"
    price: { type: Number, required: true }, // e.g., 60 TK, 100 TK
    estimatedDays: { type: Number }, // Optional
  },
  { timestamps: false }
);

// Index for name
// deliveryPricingRuleSchema.index({ name: 1 });

const DeliveryPricing = mongoose.model(
  "DeliveryPricing",
  deliveryPricingRuleSchema
);
export default DeliveryPricing;
