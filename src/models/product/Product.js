// models/Product.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import Review from "./Review.js";
import slugify from "slugify"; // Import slugify

// Existing Schemas (Variation, etc.)
const variationOptionSchema = new mongoose.Schema(
  {
    value: { type: String, required: true }, // e.g., "Red", "Blue", "M", "L"
    priceModifier: { type: Number, default: 0 }, // Additional price if any
    images: [String], // URLs to images specific to this variation
    quantity: { type: Number, default: 0 }, // Available quantity for this variation
  },
  { _id: false }
);

const variationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Color", "Size"
    options: [variationOptionSchema],
  },
  { _id: false }
);

// Simplified Discount Schema (from previous steps)
const discountSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: [0, "Discount value must be positive"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          // Ensure endDate is after startDate
          return value > this.startDate;
        },
        message: "endDate must be greater than startDate",
      },
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Main Product Schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
    },
    basePrice: {
      // Base price without any variation modifiers
      type: Number,
      required: true,
      min: [0, "Base price must be positive"],
    },
    quantity: {
      // Available quantity
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
    },
    images: [String], // Array of image URLs
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    variations: [variationSchema], // Dynamic variations
    properties: mongoose.Schema.Types.Mixed, // Additional properties
    tags: [String], // e.g., ["featured", "new"]
    totalSales: {
      type: Number,
      default: 0,
      index: false, // Set to true if indexing is needed for queries
    },
    discount: discountSchema, // Single discount object

    // **New Fields for Ratings**
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Average rating must be at least 0"],
      max: [5, "Average rating cannot exceed 5"],
      index: true, // Indexing for efficient sorting/filtering
    },
    numReviews: {
      type: Number,
      default: 0,
      min: [0, "Number of reviews cannot be negative"],
    },
  },
  { timestamps: true }
);

// Text index for search functionality
productSchema.index({ name: "text", description: "text", tags: "text" });

// Index for category
productSchema.index({ category: 1 });

// Plugin for pagination
productSchema.plugin(mongoosePaginate);

// Virtual to determine if the discount is currently active
productSchema.virtual("isDiscountActive").get(function () {
  if (!this.discount) return false;
  const now = new Date();
  return (
    this.discount.startDate <= now &&
    this.discount.endDate >= now
  );
});

// Virtual to calculate currentPrice
productSchema.virtual("currentPrice").get(function () {
  if (this.isDiscountActive) {
    const { type, value } = this.discount;
    if (type === "percentage") {
      return this.basePrice * (1 - value / 100);
    } else if (type === "fixed") {
      return Math.max(this.basePrice - value, 0);
    }
  }
  return this.basePrice;
});

// Ensure virtuals are included when converting to JSON or Object
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

/**
 * Pre 'validate' middleware to generate slug before saving.
 */
productSchema.pre("validate", async function (next) {
  if (this.isModified("name")) {
    // Generate initial slug
    let slugCandidate = slugify(this.name, { lower: true, strict: true });

    // Check if the slug already exists
    const Product = mongoose.model("Product", productSchema);
    let slugExists = await Product.exists({ slug: slugCandidate, _id: { $ne: this._id } });

    let suffix = 1;
    // Append suffix until a unique slug is found
    while (slugExists) {
      const newSlug = `${slugCandidate}-${suffix}`;
      slugExists = await Product.exists({ slug: newSlug, _id: { $ne: this._id } });
      if (!slugExists) {
        slugCandidate = newSlug;
        break;
      }
      suffix++;
    }

    this.slug = slugCandidate;
  }
  next();
});

/**
 * Pre 'remove' middleware.
 * This middleware is triggered when document.remove() is called.
 */
// Replace the pre 'remove' middleware with pre 'deleteOne'
productSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    await Review.deleteMany({ product: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

// Update the pre 'findOneAndDelete' middleware
productSchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
      await Review.deleteMany({ product: doc._id });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product;
