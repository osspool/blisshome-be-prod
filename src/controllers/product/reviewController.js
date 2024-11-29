// controllers/reviewController.js
import Review from "#src/models/product/Review.js";
import Product from "#models/product/Product.js";

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private/Customer
export const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user has already reviewed the product
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const deleteReview = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id; // Assuming authentication middleware sets req.user
  const isAdmin = req.user.isAdmin; // Assuming admin flag

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the requester is the review owner or an admin
    if (review.user.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await review.remove();

    res.json({ message: "Review removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// @desc    Get all reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const reviews = await Review.find({ product: productId })
      .populate("user", "name") // Populate user details if needed
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};