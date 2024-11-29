// services/searchService.js
import Product from "#models/product/Product.js";
import Order from "#models/order/Order.js";
import User from "#models/User.js";

// Product Search Service
/**
 * Searches for products based on a search term and filters.
 * @param {String} searchTerm - The term to search for.
 * @param {Object} filters - Filters to apply (e.g., category, tags, basePrice).
 * @param {Object} options - Pagination and selection options.
 * @returns {Object} - Paginated products.
 */
export const searchProducts = async (searchTerm, filters, options) => {
  const query = {};
  
  if (filters.category) {
    query.category = filters.category;
  }

  // Apply tags filter
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
    // If you want to ensure all tags are present, use $all instead:
    // query.tags = { $all: filters.tags };
  }

  // Apply price range filter
  if (filters.basePrice) {
    query.basePrice = filters.basePrice; // basePrice may contain $gte and/or $lte
  }

  // Apply text search
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  // console.log("Final Query:", query);

  return await Product.paginate(query, options);
};



// Order Search Service
export const searchOrders = async (searchTerm, filters, options) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.customer) {
    query.customer = filters.customer;
  }

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  return await Order.paginate(query, options);
};

// Customer Search Service
export const searchCustomers = async (searchTerm, options) => {
  const query = { role: "customer" };

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  return await User.paginate(query, options);
};
