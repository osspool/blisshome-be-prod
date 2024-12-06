// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import mongoosePaginate from "mongoose-paginate-v2";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g., "Home", "Office"
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin", "superadmin"],
      default: "customer",
    },
    // Optional addresses
    addresses: [addressSchema],
    phone: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    totalOrders: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
userSchema.index({ name: "text", email: "text" });

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.plugin(mongoosePaginate);
// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
