// models/Review.js
import mongoose from "mongoose";
import Product from "./Product.js"; // Import Product model to update ratings

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

// **Add Index by Product**
reviewSchema.index({ product: 1 });

// **Static Method to Calculate Average Rating**
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    if (result.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: result[0].averageRating,
        numReviews: result[0].numReviews,
      });
    } else {
      // No reviews left
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        numReviews: 0,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

// **Post-save Middleware to Update Ratings**
reviewSchema.post("save", function () {
  // 'this' points to the current review
  this.constructor.calculateAverageRating(this.product);
});

// **Post-remove Middleware to Update Ratings**
reviewSchema.post("remove", function () {
  // 'this' points to the current review
  this.constructor.calculateAverageRating(this.product);
});

// **Pre-remove Middleware for findOneAndDelete and similar methods**
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne(); // Save the document for post middleware
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calculateAverageRating(this.r.product);
  }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
