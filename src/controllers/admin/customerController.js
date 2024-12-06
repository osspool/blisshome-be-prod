// controllers/customerController.js
import User from "#models/User.js";
import mongoose from "mongoose";

// If you want to get multiple top customers, you can use this version:
export const getTopCustomers = async (req, res) => {
  try {
    const { limit = 5 } = req.query; // Default to top 5 customers

    const topCustomers = await User.find()
      .sort({ totalPurchases: -1 })
      .limit(parseInt(limit, 10))
      .select("name email phone addresses totalOrders totalPurchases createdAt")
      .lean();

    if (!topCustomers.length) {
      return res.status(404).json({ message: "No customers found" });
    }

    res.json({ topCustomers });
  } catch (error) {
    console.error("Error in getTopCustomers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// @desc    Get all customers with pagination, filtering, and search
// @route   GET /api/customers
// @access  Private/Admin
export const getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
      dateFrom,
      dateTo,
    } = req.query;

    // Base query
    const query = {role: ["customer", "admin"]};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Pagination options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sortField]: sortOrder === "desc" ? -1 : 1 },
      select: "name email phone role addresses totalOrders totalPurchases createdAt",
      lean: true,
    };

    const customers = await User.paginate(query, options);

    // Transform response
    const response = {
      customers: customers.docs,
      pagination: {
        currentPage: customers.page,
        totalPages: customers.totalPages,
        totalCustomers: customers.totalDocs,
        hasNextPage: customers.hasNextPage,
        hasPrevPage: customers.hasPrevPage,
        limit: customers.limit,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error in getCustomers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private/Admin
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await User.findOne({ _id: id, role: "customer" })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error in getCustomerById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // Remove sensitive fields from update data
    delete updateData.password;
    delete updateData.resetPasswordToken;
    delete updateData.resetPasswordExpires;

    const customer = await User.findOneAndUpdate(
      { _id: id},
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer updated successfully", customer });
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await User.findOneAndDelete({ _id: id, role: "customer" });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};