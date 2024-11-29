// controllers/customerController.js
import User from "../../models/User.js";
import mongoosePaginate from "mongoose-paginate-v2";

// @desc    Get all customers with pagination and search
// @route   GET /api/customers
// @access  Private/Admin
export const getCustomers = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const query = { role: "customer" };

  if (search) {
    query.$text = { $search: search };
  }

  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: "name email addresses",
    };

    const customers = await User.paginate(query, options);
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private/Admin
export const getCustomerById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }

  try {
    const customer = await User.findById(id).select("name email addresses");
    if (customer && customer.role === "customer") {
      res.json(customer);
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
export const updateCustomer = async (req, res) => {
  const { name, email, addresses } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }

  try {
    const customer = await User.findById(id);
    if (customer && customer.role === "customer") {
      if (name) customer.name = name;
      if (email) customer.email = email;
      if (addresses) customer.addresses = addresses; // Expecting full addresses array

      await customer.save();
      res.json({ message: "Customer updated", customer });
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }

  try {
    const customer = await User.findById(id);
    if (customer && customer.role === "customer") {
      await customer.remove();
      res.json({ message: "Customer removed" });
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
