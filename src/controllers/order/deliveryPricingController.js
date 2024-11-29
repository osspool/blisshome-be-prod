// controllers/deliveryPricingController.js
import DeliveryPricing from "#src/models/order/DeliveryPricing.js";

// @desc    Create a new delivery pricing rule
// @route   POST /api/delivery-pricing
// @access  Private/Admin
export const createDeliveryPricing = async (req, res) => {
  const { name, region, price, estimatedDays } = req.body;

  try {
    const existingRule = await DeliveryPricing.findOne({ name });
    if (existingRule) {
      return res
        .status(400)
        .json({ message: "Delivery pricing rule already exists" });
    }

    const rule = new DeliveryPricing({
      name,
      region,
      price,
      estimatedDays,
    });

    const createdRule = await rule.save();
    res.status(201).json(createdRule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all delivery pricing rules
// @route   GET /api/delivery-pricing
// @access  Private/Admin
export const getDeliveryPricing = async (req, res) => {
  try {
    const rules = await DeliveryPricing.find();
    res.json(rules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a delivery pricing rule
// @route   PUT /api/delivery-pricing/:id
// @access  Private/Admin
export const updateDeliveryPricing = async (req, res) => {
  const { name, region, price, estimatedDays } = req.body;

  try {
    const rule = await DeliveryPricing.findById(req.params.id);
    if (!rule) {
      return res
        .status(404)
        .json({ message: "Delivery pricing rule not found" });
    }

    if (name) rule.name = name;
    if (region) rule.region = region;
    if (price) rule.price = price;
    if (estimatedDays !== undefined) rule.estimatedDays = estimatedDays;

    const updatedRule = await rule.save();
    res.json(updatedRule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a delivery pricing rule
// @route   DELETE /api/delivery-pricing/:id
// @access  Private/Admin
export const deleteDeliveryPricing = async (req, res) => {
  try {
    const rule = await DeliveryPricing.findById(req.params.id);
    if (!rule) {
      return res
        .status(404)
        .json({ message: "Delivery pricing rule not found" });
    }

    await rule.deleteOne();
    res.json({ message: "Delivery pricing rule removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
