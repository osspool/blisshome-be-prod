import Product from "#models/product/Product.js";

// @desc    Get recommended products based on category
// @route   GET /api/recommendations/:productId
// @access  Public
export const getRecommendations = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate(
      "category"
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find products in the same category, excluding the current product
    const recommendations = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
    })
      .limit(4)
      .select("name price images basePrice discount");

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
