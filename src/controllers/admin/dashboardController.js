// controllers/dashboardController.js
import Order from "#src/models/order/Order.js";
import Payment from "#src/models/order/Payment.js";

/**
 * Utility function to validate year and month.
 */
const validateYearMonth = (year, month) => {
  const currentYear = new Date().getFullYear();
  if (year && (isNaN(year) || year < 2000 || year > currentYear)) {
    return { valid: false, message: "Invalid year provided." };
  }
  if (month && (isNaN(month) || month < 1 || month > 12)) {
    return { valid: false, message: "Invalid month provided." };
  }
  return { valid: true };
};

/**
 * Get Dashboard Summary
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // Extract query parameters
    const { year, month } = req.query;

    // Validate query parameters
    const { valid, message } = validateYearMonth(year, month);
    if (!valid) {
      return res.status(400).json({ message });
    }

    // Convert query parameters to integers if they exist
    const selectedYear = year ? parseInt(year, 10) : null;
    const selectedMonth = month ? parseInt(month, 10) : null;

    let summaryData = {};

    if (selectedYear && selectedMonth) {
      // Query Orders and Payments directly for specific month and year
      const [totalOrders, totalSalesAgg, statusCountsAgg, paymentStatusCountsAgg] = await Promise.all([
        Order.countDocuments({
          createdAt: { $gte: new Date(selectedYear, selectedMonth - 1, 1), $lt: new Date(selectedYear, selectedMonth, 1) }
        }),
        Order.aggregate([
          {
            $match: { createdAt: { $gte: new Date(selectedYear, selectedMonth - 1, 1), $lt: new Date(selectedYear, selectedMonth, 1) } }
          },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        Order.aggregate([
          {
            $match: { createdAt: { $gte: new Date(selectedYear, selectedMonth - 1, 1), $lt: new Date(selectedYear, selectedMonth, 1) } }
          },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),
        Payment.aggregate([
          {
            $match: { createdAt: { $gte: new Date(selectedYear, selectedMonth - 1, 1), $lt: new Date(selectedYear, selectedMonth, 1) } }
          },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ])
      ]);

      // Format Aggregated Results
      const formattedStatusCounts = statusCountsAgg.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      const formattedPaymentStatusCounts = paymentStatusCountsAgg.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      summaryData = {
        year: selectedYear,
        month: selectedMonth,
        totalOrders,
        totalSales: totalSalesAgg[0]?.total || 0,
        statusCounts: formattedStatusCounts,
        paymentStatusCounts: formattedPaymentStatusCounts
      };
    } else if (selectedYear) {
      // Fetch all data for the specified year
      const monthlyData = [];

      for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
        const [totalOrders, totalSalesAgg, statusCountsAgg, paymentStatusCountsAgg] = await Promise.all([
          Order.countDocuments({
            createdAt: { $gte: new Date(selectedYear, monthIndex - 1, 1), $lt: new Date(selectedYear, monthIndex, 1) }
          }),
          Order.aggregate([
            {
              $match: { createdAt: { $gte: new Date(selectedYear, monthIndex - 1, 1), $lt: new Date(selectedYear, monthIndex, 1) } }
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
          ]),
          Order.aggregate([
            {
              $match: { createdAt: { $gte: new Date(selectedYear, monthIndex - 1, 1), $lt: new Date(selectedYear, monthIndex, 1) } }
            },
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ]),
          Payment.aggregate([
            {
              $match: { createdAt: { $gte: new Date(selectedYear, monthIndex - 1, 1), $lt: new Date(selectedYear, monthIndex, 1) } }
            },
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ])
        ]);

        const formattedStatusCounts = statusCountsAgg.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        const formattedPaymentStatusCounts = paymentStatusCountsAgg.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        monthlyData.push({
          month: monthIndex,
          totalOrders,
          totalSales: totalSalesAgg[0]?.total || 0,
          statusCounts: formattedStatusCounts,
          paymentStatusCounts: formattedPaymentStatusCounts
        });
      }

      summaryData = {
        year: selectedYear,
        monthlyData
      };
    } else {
      // Default: Fetch real-time metrics and current month/year data
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // Months are 0-indexed

      // Real-time Metrics
      const [totalOrders, totalSalesAgg, statusCountsAgg, paymentStatusCountsAgg] = await Promise.all([
        Order.countDocuments(),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      ]);

      // Format Aggregated Results
      const formattedStatusCounts = statusCountsAgg.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      const formattedPaymentStatusCounts = paymentStatusCountsAgg.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      summaryData = {
        totalOrders,
        totalSales: totalSalesAgg[0]?.total || 0,
        statusCounts: formattedStatusCounts,
        paymentStatusCounts: formattedPaymentStatusCounts
      };
    }

    res.json(summaryData);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};
