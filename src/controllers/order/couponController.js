// controllers/couponController.js
import Coupon from "../../models/order/Coupon.js";



export const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the coupon by code (case-insensitive)
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Optionally, check if the coupon is expired
    const now = new Date();
    if (coupon.expiresAt < now) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    // Optionally, check usage limits
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    res.json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  const {
    code,
    discountType,
    discountAmount,
    minOrderAmount,
    maxDiscountAmount,
    expiresAt,
    usageLimit,
  } = req.body;

  try {
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = new Coupon({
      code,
      discountType,
      discountAmount,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      expiresAt,
      usageLimit: usageLimit || 1,
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  const {
    code,
    discountType,
    discountAmount,
    minOrderAmount,
    maxDiscountAmount,
    expiresAt,
    usageLimit,
  } = req.body;

  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (code) coupon.code = code;
    if (discountType) coupon.discountType = discountType;
    if (discountAmount) coupon.discountAmount = discountAmount;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined)
      coupon.maxDiscountAmount = maxDiscountAmount;
    if (expiresAt) coupon.expiresAt = expiresAt;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await coupon.deleteOne();
    res.json({ message: "Coupon removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
