// services/orderService.js
import { getDeliveryAddress } from './deliveryService.js';
import { createPayment } from './paymentService.js';
import { calculateDiscount } from './couponService.js';
import { updateProductStock, updateProductVariationStock } from '#src/utils/orderUtils.js';
import Cart from '#models/order/Cart.js';
import Order from '#models/order/Order.js';
import User from '#models/User.js';
import DeliveryPricing from '#models/order/DeliveryPricing.js';
import mongoose from 'mongoose';

export const createOrder = async (userId, orderData) => {
  const {
    deliveryMethodId,
    deliveryAddressId,
    useSavedAddress,
    couponCode,
    paymentType,
    paymentMethodId,
    paymentMethodName,
    metaData,
    manualAddress, 
  } = orderData;

  try {
    // Fetch cart and user
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Get delivery address using utility function
    const deliveryAddress = await getDeliveryAddress(user, useSavedAddress, deliveryAddressId, manualAddress);

    // Fetch delivery pricing
    const deliveryRule = await DeliveryPricing.findById(deliveryMethodId);
    if (!deliveryRule) throw new Error("Invalid delivery method");

    // Initialize order items and pricing
    let totalAmount = 0;
    const orderItems = [];

    // Process cart items
    for (let item of cart.items) {
      const product = item.product;

      if (product.quantity < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      // Calculate item price considering variations
      let itemPrice = product.currentPrice;
      if (item.variations && Array.isArray(item.variations)) {
        for (let variation of item.variations) {
          const { name, option } = variation;
          const productVariation = product.variations.find((v) => v.name === name);
          if (productVariation) {
            const productOption = productVariation.options.find((o) => o.value === option.value);
            if (productOption?.priceModifier) {
              itemPrice += productOption.priceModifier;
            }
          }
        }
      }

      totalAmount += itemPrice * item.quantity;

      orderItems.push({
        product: product._id,
        productName: product.name,
        variations: item.variations,
        quantity: item.quantity,
        price: itemPrice,
      });

      // Update stock for product and variations
      await updateProductStock(product._id, item.quantity);

      if (item.variations) {
        for (let variation of item.variations) {
          await updateProductVariationStock(product._id, variation, item.quantity);
        }
      }
    }

    // Apply delivery price to total amount
    totalAmount += deliveryRule.price;

    // Apply coupon discount if available
    let couponApplied = null;
    if (couponCode) {
      const { coupon, discountType, discountAmount } = await calculateDiscount(couponCode, totalAmount);
      couponApplied = {
        coupon: coupon._id,
        code: coupon.code,
        discountType,
        discountAmount,
      };
      totalAmount -= discountAmount;
    }

    // Create order without payment details
    const order = new Order({
      customer: userId,
      items: orderItems,
      totalAmount,
      delivery: {
        method: deliveryRule.name,
        price: deliveryRule.price,
        estimatedDays: deliveryRule.estimatedDays,
      },
      status: "Pending",
      paymentType,
      paymentStatus: "Pending",
      deliveryDetails: { address: deliveryAddress, method: deliveryRule.method },
      couponApplied,
    });

    order.statusHistory.push({ status: "Pending" });
    const createdOrder = await order.save();

    // Update user statistics
    user.totalOrders += 1;
    user.totalPurchases += totalAmount;
    await user.save(); // Save the updated user

    // Create payment based on payment type
    let createdPayment = await createPayment({
      orderId: createdOrder._id,
      customerId: userId,
      paymentType,
      paymentMethodId,
      paymentMethodName: paymentType === "online" ? paymentMethodName : "COD",
      metaData,
    });

    createdOrder.payment = createdPayment._id;
    await createdOrder.save();

    // Clear cart after order creation
    cart.items = [];
    await cart.save();

    return {
      order: createdOrder,
      paymentId: createdPayment._id,
      message: paymentType === "online" ? "Order created." : "Order created with COD.",
    };
  } catch (error) {
    console.error(error);
    throw new Error(error.message || "Error creating order");
  }
};
