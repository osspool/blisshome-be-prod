// services/summaryService.js
import MonthlySummary from "#models/admin/MonthlySummary.js";

/**
 * Updates the MonthlySummary collection based on order data.
 * @param {Date} orderDate - The creation date of the order.
 * @param {Number} amount - The total amount of the order.
 * @param {String} status - The status of the order.
 * @param {String} paymentStatus - The payment status of the order.
 */
export const updateMonthlySummary = async (orderDate, amount, status, paymentStatus) => {
  const year = orderDate.getFullYear();
  const month = orderDate.getMonth() + 1; // Months are 0-indexed

  const summary = await MonthlySummary.findOne({ year, month });

  if (summary) {
    summary.totalOrders += 1;
    summary.totalSales += amount;

    // Increment status counts
    if (summary.statusCounts[status] !== undefined) {
      summary.statusCounts[status] += 1;
    } else {
      summary.statusCounts[status] = 1;
    }

    // Increment payment status counts
    if (summary.paymentStatusCounts[paymentStatus] !== undefined) {
      summary.paymentStatusCounts[paymentStatus] += 1;
    } else {
      summary.paymentStatusCounts[paymentStatus] = 1;
    }

    await summary.save();
  } else {
    // Create a new summary document if it doesn't exist
    await MonthlySummary.create({
      year,
      month,
      totalOrders: 1,
      totalSales: amount,
      statusCounts: {
        [status]: 1,
      },
      paymentStatusCounts: {
        [paymentStatus]: 1,
      },
    });
  }
};
