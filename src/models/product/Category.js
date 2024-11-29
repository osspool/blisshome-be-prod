// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    description: {
      type: String,
    },
    image: {
      type: String, // URL to the category image
    },
    tags: {
      type: [String], // Array of tags, e.g., ["featured", "new"]
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
