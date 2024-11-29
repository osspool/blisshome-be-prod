// controllers/categoryController.js
import Category from "#src/models/product/Category.js";
import { processAndSaveImage, deleteImage } from "#services/imageService.js";

/**
 * @desc    Get all categories with optional limit and tag filtering
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    let { limit, tags } = req.query;
    limit = parseInt(limit, 10) || 0; // 0 means no limit

    const filter = {};
    if (tags) {
      const tagsArray = Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim());
      filter.tags = { $in: tagsArray };
    }

    const categoriesQuery = Category.find(filter).populate("parent", "name");
    if (limit > 0) {
      categoriesQuery.limit(limit);
    }

    const categories = await categoriesQuery;
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parent",
      "name"
    );
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Create a new category with optional image and tags
 * @route   POST /api/categories
 * @access  Private/Admin
 */
export const createCategory = async (req, res) => {
  const { name, parent, description, tags, resizeWidth, disableResize } = req.body;
  const file = req.file; // Category image

  try {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    let imageUrl;
    if (file) {
      imageUrl = await processAndSaveImage(
        file.buffer,
        file.originalname,
        "category",
        {
          resizeWidth: resizeWidth ? parseInt(resizeWidth, 10) : 400,
          disableResize: disableResize === "true" || disableResize === true,
        }
      );
    }

    const category = new Category({
      name,
      parent: parent || null,
      description,
      image: imageUrl || undefined,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * @desc    Update a category with optional image and tags
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (req, res) => {
  const { name, parent, description, tags, removeImage, resizeWidth, disableResize } = req.body;
  const file = req.file; // New category image

  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      if (name) category.name = name;
      if (parent !== undefined) category.parent = parent;
      if (description) category.description = description;
      if (tags) {
        category.tags = tags.split(",").map((tag) => tag.trim());
      }

      // Handle image removal
      if (removeImage && category.image) {
        await deleteImage(category.image);
        category.image = undefined;
      }

      // Handle new image upload
      if (file) {
        // Delete existing image if any
        if (category.image) {
          await deleteImage(category.image);
        }
        const imageUrl = await processAndSaveImage(
          file.buffer,
          file.originalname,
          "category",
          {
            resizeWidth: resizeWidth ? parseInt(resizeWidth, 10) : 800,
            disableResize: disableResize === "true" || disableResize === true,
          }
        );
        category.image = imageUrl;
      }

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      // Optional: Check for subcategories or products before deletion
      // For example, ensure no products are linked to this category

      // Delete associated image if exists
      if (category.image) {
        await deleteImage(category.image);
      }

      await category.deleteOne();
      res.json({ message: "Category removed" });
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
