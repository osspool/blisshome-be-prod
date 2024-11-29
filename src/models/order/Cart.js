// models/Cart.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variations: mongoose.Schema.Types.Mixed, // e.g., [{ Color: 'Red', Size: 'M' }]
  quantity: { type: Number, default: 1 },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

// Index for user
cartSchema.index({ user: 1 });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
