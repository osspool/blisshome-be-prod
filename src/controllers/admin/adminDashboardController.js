// controllers/adminDashboardController.js
import Order from "../../models/Order.js";
import Coupon from "../../models/Coupon.js";

// @desc    Get total sales
// @route   GET /api/admin-dashboard/total-sales
// @access  Private/Admin
export const getTotalSales = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $match: { paymentStatus: "Completed", status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalSales = result[0] ? result[0].totalSales : 0;
    const totalOrders = result[0] ? result[0].totalOrders : 0;

    res.json({ totalSales, totalOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get sales by region
// @route   GET /api/admin-dashboard/sales-by-region
// @access  Private/Admin
export const getSalesByRegion = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $match: { paymentStatus: "Completed", status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$deliveryDetails.address.city",
          totalSales: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get top selling products
// @route   GET /api/admin-dashboard/top-products
// @access  Private/Admin
export const getTopProducts = async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const result = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { paymentStatus: "Completed", status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit, 10) },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          totalSold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get active coupons
// @route   GET /api/admin-dashboard/active-coupons
// @access  Private/Admin
export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      expiresAt: { $gt: now },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    });

    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
