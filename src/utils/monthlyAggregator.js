// utils/monthlyAggregator.js
import cron from "node-cron";
import Order from "#models/order/Order.js";
import Payment from "#models/order/Payment.js";
import MonthlySummary from "#models/admin/MonthlySummary.js";

/**
 * Function to aggregate data for the previous month and store it in MonthlySummary.
 */
const aggregateMonthlyData = async () => {
  const now = new Date();
  // Get the previous month
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed (0 = January)

  if (month === 0) {
    month = 12;
    year -= 1;
  }

  // Define start and end dates for the previous month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  try {
    // Total Orders
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $ne: "Cancelled" }, // Exclude cancelled orders if necessary
    });

    // Total Sales
    const totalSalesAgg = await Order.aggregate([
      {
        $match: { 
          createdAt: { $gte: startDate, $lt: endDate },
          status: { $ne: "Cancelled" }, // Exclude cancelled orders if necessary
        },
      },
      {
        $group: { _id: null, total: { $sum: "$totalAmount" } },
      },
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    // Status Counts
    const statusCounts = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lt: endDate } },
      },
      {
        $group: { _id: "$status", count: { $sum: 1 } },
      },
    ]);

    const formattedStatusCounts = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Payment Status Counts
    const paymentStatusCounts = await Payment.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lt: endDate } },
      },
      {
        $group: { _id: "$status", count: { $sum: 1 } },
      },
    ]);

    const formattedPaymentStatusCounts = paymentStatusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Create or Update MonthlySummary
    await MonthlySummary.findOneAndUpdate(
      { year, month },
      {
        totalOrders,
        totalSales,
        statusCounts: formattedStatusCounts,
        paymentStatusCounts: formattedPaymentStatusCounts,
      },
      { upsert: true, new: true }
    );

    console.log(`Monthly summary for ${month}/${year} aggregated successfully.`);
  } catch (error) {
    console.error("Error aggregating monthly data:", error);
  }
};

/**
 * Schedule the aggregation to run on the 1st day of every month at 00:00.
 */
export const scheduleMonthlyAggregation = () => {
  cron.schedule("0 0 1 * *", () => {
    console.log("Running monthly aggregation task...");
    aggregateMonthlyData();
  });
};
