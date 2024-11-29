// controllers/addressController.js
import User from "../../models/User.js";

// @desc    Get all saved addresses for the user
// @route   GET /api/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add a new address
// @route   POST /api/addresses
// @access  Private
export const addAddress = async (req, res) => {
  const {
    label,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    phone,
  } = req.body;

  try {
    const user = await User.findById(req.user._id);
    user.addresses.push({
      label,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
    });
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update an existing address
// @route   PUT /api/addresses/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  const {
    label,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    phone,
  } = req.body;

  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    address.label = label || address.label;
    address.addressLine1 = addressLine1 || address.addressLine1;
    address.addressLine2 = addressLine2 || address.addressLine2;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    address.phone = phone || address.phone;

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete an address
// @route   DELETE /api/addresses/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    address.deleteOne();
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
