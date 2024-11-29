// controllers/productController.js
import Product from "#models/product/Product.js";
import Category from "#src/models/product/Category.js";
import { searchProducts } from "#services/searchService.js";
import { processAndSaveImage, deleteImage } from "#services/imageService.js";
import mongoose from "mongoose";
import Review from "#src/models/product/Review.js";

// @desc    Get all products with pagination, search and filtering
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    tags,
    sortBy,
    order = "asc", // Default order is ascending
    search,
    minPrice,
    maxPrice,
  } = req.query;

  // console.log("quer", req.query);

  const filters = {};

  // Filter by category
  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    filters.category = new mongoose.Types.ObjectId(category); // Convert to ObjectId
  }

  // Filter by tags
  if (tags) {
    const tagsArray = tags.split(",").map((tag) => tag.trim());
    filters.tags = tagsArray; // Pass the array directly
  }

  // Filter by price range
  const parsedMinPrice = parseFloat(minPrice);
  const parsedMaxPrice = parseFloat(maxPrice);

  if (!isNaN(parsedMinPrice) || !isNaN(parsedMaxPrice)) {
    filters.basePrice = {};
    if (!isNaN(parsedMinPrice)) {
      filters.basePrice.$gte = parsedMinPrice;
    }
    if (!isNaN(parsedMaxPrice)) {
      filters.basePrice.$lte = parsedMaxPrice;
    }

    // Validate that minPrice is not greater than maxPrice
    if (
      !isNaN(parsedMinPrice) &&
      !isNaN(parsedMaxPrice) &&
      parsedMinPrice > parsedMaxPrice
    ) {
      return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
    }
  }

  // Text search
  if (search) {
    filters.$text = { $search: search };
  }

  // Define allowed sort fields
  const allowedSortBy = ["totalSales", "averageRating", "price"];
  let sortField = "createdAt"; // Default sort field
  let sortOrder = -1; // Default sort order (descending)

  if (sortBy) {
    if (allowedSortBy.includes(sortBy)) {
      sortField = sortBy === "price" ? "basePrice" : sortBy;
      sortOrder = order === "desc" ? -1 : 1;
    } else {
      return res.status(400).json({ message: `Invalid sortBy field. Allowed fields: ${allowedSortBy.join(", ")}` });
    }
  } else {
    // Default sort by creation date descending
    sortField = "createdAt";
    sortOrder = -1;
  }

  const sortOptions = {};
  sortOptions[sortField] = sortOrder;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: sortOptions,
    select: '-description', // Exclude the 'description' field
    populate: [
      { path: "category", select: "name" },
    ],
    // Do not use lean to ensure virtuals are included
  };

  try {
    const products = await searchProducts(search, filters, options);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(id)
      .populate("category", "name")

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new product with variations
// @route   POST /api/products
// @access  Private/Admin/Staff
export const createProduct = async (req, res) => {
  const {
    name,
    description,
    basePrice,
    quantity,
    category,
    variations,
    properties,
    tags,
    discount, // New discount field
  } = req.body;
  const files = req.files || [];

  try {
    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const parsedVariations = variations ? JSON.parse(variations) : [];

    // Validate variations
    parsedVariations.forEach((variation) => {
      if (!variation.name || !Array.isArray(variation.options)) {
        throw new Error("Invalid variation format");
      }
      variation.options.forEach((option) => {
        if (!option.value) {
          throw new Error("Variation option must have a value");
        }
      });
    });

    // Process and save images
    const images = await Promise.all(
      files.map((file) => processAndSaveImage(file.buffer, file.originalname))
    );

    // Parse and validate discount
    let parsedDiscount = null;
    if (discount) {
      parsedDiscount = JSON.parse(discount);
      const { type, value, startDate, endDate, description } = parsedDiscount;

      // Basic validation
      if (
        !type ||
        !["percentage", "fixed"].includes(type) ||
        typeof value !== "number" ||
        !startDate ||
        !endDate
      ) {
        throw new Error("Invalid discount format");
      }

      // Ensure endDate is after startDate
      if (new Date(endDate) <= new Date(startDate)) {
        throw new Error("endDate must be greater than startDate");
      }
    }

    const product = new Product({
      name,
      description,
      basePrice,
      quantity,
      category,
      variations: parsedVariations,
      properties: properties ? JSON.parse(properties) : {},
      images,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      discount: parsedDiscount, // Assign discount
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc    Update a product with variations
// @route   PUT /api/products/:id
// @access  Private/Admin/Staff
export const updateProduct = async (req, res) => {
  const {
    name,
    description,
    basePrice,
    quantity,
    category,
    variations,
    properties,
    tags,
    discount, // New discount field
    removeImages, // Array of image URLs to remove
  } = req.body;
  const files = req.files || [];

  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      if (name) product.name = name;
      if (description) product.description = description;
      if (basePrice !== undefined) product.basePrice = basePrice;
      if (quantity !== undefined) product.quantity = quantity;
      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({ message: "Invalid category ID" });
        }
        product.category = category;
      }
      if (variations) {
        const parsedVariations = JSON.parse(variations);
        // Validate variations
        parsedVariations.forEach((variation) => {
          if (!variation.name || !Array.isArray(variation.options)) {
            throw new Error("Invalid variation format");
          }
          variation.options.forEach((option) => {
            if (!option.value) {
              throw new Error("Variation option must have a value");
            }
          });
        });
        product.variations = parsedVariations;
      }
      if (properties) {
        product.properties = JSON.parse(properties);
      }
      if (tags) {
        product.tags = tags.split(",").map((tag) => tag.trim());
      }

      // Handle discount
      if (discount !== undefined) { // Allow setting discount to null
        if (discount) {
          const parsedDiscount = JSON.parse(discount);
          const { type, value, startDate, endDate, description } = parsedDiscount;

          // Basic validation
          if (
            !type ||
            !["percentage", "fixed"].includes(type) ||
            typeof value !== "number" ||
            !startDate ||
            !endDate
          ) {
            throw new Error("Invalid discount format");
          }

          // Ensure endDate is after startDate
          if (new Date(endDate) <= new Date(startDate)) {
            throw new Error("endDate must be greater than startDate");
          }

          product.discount = parsedDiscount;
        } else {
          // If discount is explicitly set to null, remove it
          product.discount = undefined;
        }
      }

      // Handle image removals
      if (removeImages && Array.isArray(JSON.parse(removeImages))) {
        const toRemove = JSON.parse(removeImages);
        product.images = product.images.filter((imgUrl) => {
          if (toRemove.includes(imgUrl)) {
            deleteImage(imgUrl);
            return false;
          }
          return true;
        });
      }

      // Process and add new images
      if (files.length > 0) {
        const newImages = await Promise.all(
          files.map((file) =>
            processAndSaveImage(file.buffer, file.originalname)
          )
        );
        product.images = [...product.images, ...newImages];
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    // Use findById to get the product document
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove associated images from the server
    await Promise.all(
      product.images.map((imageUrl) => deleteImage(imageUrl))
    );

    // Use deleteOne instead of remove
    await Product.deleteOne({ _id: id });

    // Since we're using deleteOne, we need to manually trigger the review deletion
    await Review.deleteMany({ product: id });

    res.json({ message: "Product and associated reviews removed successfully" });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};