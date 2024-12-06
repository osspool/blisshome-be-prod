// services/localImageService.js
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_DIR_PRODUCTS = path.join(__dirname, "../../uploads/images/products");
const IMAGE_DIR_LANDING = path.join(__dirname, "../../uploads/images/landing");
const IMAGE_DIR_CATEGORIES = path.join(__dirname, "../../uploads/images/categories");

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3080";

// Ensure directories exist
Promise.all([
  fs.mkdir(IMAGE_DIR_PRODUCTS, { recursive: true }),
  fs.mkdir(IMAGE_DIR_LANDING, { recursive: true }),
  fs.mkdir(IMAGE_DIR_CATEGORIES, { recursive: true })
]).catch(console.error);

/**
 * Processes and saves an image as WebP with optional resizing.
 * @param {Buffer} buffer - The image buffer.
 * @param {String} originalName - The original file name.
 * @param {String} type - The type of image ('product', 'landing', 'category').
 * @param {Object} options - Optional parameters.
 * @param {Number} [options.resizeWidth=800] - The width to resize the image to.
 * @param {Boolean} [options.disableResize=false] - If true, skips resizing.
 * @param {Number} [options.quality=80] - WebP quality (0-100).
 * @returns {String} - The URL of the saved image.
 */
export const processAndSaveImage = async (
  buffer,
  originalName,
  type = "product",
  options = {}
) => {
  const {
    resizeWidth = 800,
    disableResize = false,
    quality = 80
  } = options;

  const uniqueSuffix = uuidv4();
  const filename = `${uniqueSuffix}.webp`; // Always use .webp extension
  
  let filepath;
  switch (type) {
    case "landing":
      filepath = path.join(IMAGE_DIR_LANDING, filename);
      break;
    case "category":
      filepath = path.join(IMAGE_DIR_CATEGORIES, filename);
      break;
    case "product":
    default:
      filepath = path.join(IMAGE_DIR_PRODUCTS, filename);
      break;
  }

  try {
    let imagePipeline = sharp(buffer);

    // Apply resize if enabled
    if (!disableResize && resizeWidth) {
      imagePipeline = imagePipeline.resize(resizeWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Convert to WebP with specified quality
    await imagePipeline
      .webp({
        quality: quality,
        lossless: false, // Use lossy compression for better size optimization
        effort: 6, // Higher effort = better compression but slower processing (0-6)
      })
      .toFile(filepath);

    // Construct the full URL
    const urlPath = type === "landing" 
      ? "landing" 
      : type === "category" 
        ? "categories" 
        : "products";
    
    return `${BASE_URL}/images/${urlPath}/${filename}`;

  } catch (error) {
    console.error("Error processing and saving image:", error);
    throw new Error("Failed to process and save image.");
  }
};

/**
 * Delete an image from the server.
 * @param {String} imageUrl - The full URL of the image.
 */
export const deleteImage = async (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    let imagePath;

    if (url.pathname.startsWith("/images/products/")) {
      imagePath = path.join(IMAGE_DIR_PRODUCTS, path.basename(url.pathname));
    } else if (url.pathname.startsWith("/images/landing/")) {
      imagePath = path.join(IMAGE_DIR_LANDING, path.basename(url.pathname));
    } else if (url.pathname.startsWith("/images/categories/")) {
      imagePath = path.join(IMAGE_DIR_CATEGORIES, path.basename(url.pathname));
    } else {
      throw new Error("Unknown image type");
    }

    await fs.unlink(imagePath);
  } catch (error) {
    console.error(`Failed to delete image: ${imageUrl}`, error);
    return null;
  }
};