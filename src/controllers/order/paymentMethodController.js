// controllers/order/paymentMethodController.js
import PaymentMethod from "#models/order/PaymentMethod.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new payment method
 * @route   POST /api/payment-methods
 * @access  Private/Admin
 */
export const createPaymentMethod = async (req, res) => {
  const { name, type, details, isActive } = req.body;

  try {
    // Check if payment method with the same name exists
    const existingMethod = await PaymentMethod.findOne({ name: name.trim() });
    if (existingMethod) {
      return res.status(400).json({ message: "Payment method already exists." });
    }

    const paymentMethod = new PaymentMethod({
      name: name.trim(),
      type,
      details,
      isActive: isActive !== undefined ? isActive : true,
    });

    const createdPaymentMethod = await paymentMethod.save();

    res.status(201).json({
      message: "Payment method created successfully.",
      paymentMethod: createdPaymentMethod,
    });
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({ message: "Server error." });
  }
};


/**
 * @desc    Get all payment methods
 * @route   GET /api/payment-methods
 * @access  Public/User/Admin
 */
export const getAllPaymentMethods = async (req, res) => {
  try {
    let query = {};

    // If the user is not an admin, show only active payment methods
    if (req.user && req.user.role !== "admin") {
      query.isActive = true;
    }

    const paymentMethods = await PaymentMethod.find(query).sort({ createdAt: -1 });

    res.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ message: "Server error." });
  }
};


/**
 * @desc    Get a payment method by ID
 * @route   GET /api/payment-methods/:id
 * @access  Public/User/Admin
 */
export const getPaymentMethodById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid payment method ID." });
  }

  try {
    let query = { _id: id };

    // If the user is not an admin, ensure the payment method is active
    if (req.user && req.user.role !== "admin") {
      query.isActive = true;
    }

    const paymentMethod = await PaymentMethod.findOne(query);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found." });
    }

    res.json(paymentMethod);
  } catch (error) {
    console.error("Error fetching payment method:", error);
    res.status(500).json({ message: "Server error." });
  }
};


/**
 * @desc    Update a payment method
 * @route   PUT /api/payment-methods/:id
 * @access  Private/Admin
 */
export const updatePaymentMethod = async (req, res) => {
  const { id } = req.params;
  const { name, type, details, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid payment method ID." });
  }

  try {
    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found." });
    }

    // If updating name, check for duplicates
    if (name && name.trim() !== paymentMethod.name) {
      const existingMethod = await PaymentMethod.findOne({ name: name.trim() });
      if (existingMethod) {
        return res.status(400).json({ message: "Payment method name already exists." });
      }
      paymentMethod.name = name.trim();
    }

    if (type) {
      paymentMethod.type = type;
    }

    if (details) {
      paymentMethod.details = details;
    }

    if (isActive !== undefined) {
      paymentMethod.isActive = isActive;
    }

    const updatedPaymentMethod = await paymentMethod.save();

    res.json({
      message: "Payment method updated successfully.",
      paymentMethod: updatedPaymentMethod,
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({ message: "Server error." });
  }
};


/**
 * @desc    Soft delete a payment method
 * @route   DELETE /api/payment-methods/deactivatee/:id
 * @access  Private/Admin
 */
export const deActivatePaymentMethod = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid payment method ID." });
  }

  try {
    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found." });
    }

    // Implement soft delete by setting isActive to false
    paymentMethod.isActive = false;
    await paymentMethod.save();

    res.json({ message: "Payment method deleted (soft delete) successfully." });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({ message: "Server error." });
  }
};


export const deletePaymentMethod = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid payment method ID." });
  }

  try {
    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found." });
    }

    await paymentMethod.deleteOne();

    res.json({ message: "Payment method deleted successfully." });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({ message: "Server error." });
  }
}