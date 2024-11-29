// services/discountService.js
import Coupon from "#models/order/Coupon.js";

/**
 * Calculates discount based on the coupon code and total amount.
 * @param {String} couponCode - The coupon code.
 * @param {Number} totalAmount - The total order amount before discount.
 * @returns {Object} - Coupon details and discount information.
 * @throws {Error} - If coupon validation fails.
 */
export const calculateDiscount = async (couponCode, totalAmount) => {
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (coupon.expiresAt < new Date()) {
    throw new Error("Coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached");
  }

  if (totalAmount < coupon.minOrderAmount) {
    throw new Error(
      `Minimum order amount for this coupon is ${coupon.minOrderAmount}`
    );
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (coupon.discountAmount / 100) * totalAmount;
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "fixed") {
    discount = coupon.discountAmount;
  }

  // Update coupon usage
  coupon.usedCount += 1;
  await coupon.save();

  return {
    coupon,
    discountType: coupon.discountType,
    discountAmount: discount,
  };
};
