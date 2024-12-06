// services/s3ImageService.js
import sharp from "sharp";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const BASE_URL = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/**
 * Processes and saves an image as WebP to S3 with optional resizing.
 * @param {Buffer} buffer - The image buffer.
 * @param {String} originalName - The original file name.
 * @param {String} type - The type of image ('product', 'landing', 'category').
 * @param {Object} options - Optional parameters.
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

  try {
    let imagePipeline = sharp(buffer);

    // Apply resize if enabled
    if (!disableResize && resizeWidth) {
      imagePipeline = imagePipeline.resize(resizeWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Process image to WebP
    const processedImageBuffer = await imagePipeline
      .webp({
        quality: quality,
        lossless: false,
        effort: 6,
      })
      .toBuffer();

    // Generate unique filename
    const uniqueSuffix = uuidv4();
    const filename = `${uniqueSuffix}.webp`;
    
    // Determine S3 key (path)
    const s3Key = `images/${type}s/${filename}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: processedImageBuffer,
      ContentType: 'image/webp',
    });

    await s3Client.send(uploadCommand);

    // Return the public URL
    return `${BASE_URL}/${s3Key}`;

  } catch (error) {
    console.error("Error processing and saving image to S3:", error);
    throw new Error("Failed to process and save image to S3.");
  }
};

/**
 * Delete an image from S3.
 * @param {String} imageUrl - The full URL of the image.
 */
export const deleteImage = async (imageUrl) => {
  try {
    // Extract the key from the URL
    const url = new URL(imageUrl);
    const s3Key = url.pathname.substring(1); // Remove leading slash

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(deleteCommand);
  } catch (error) {
    console.error(`Failed to delete image from S3: ${imageUrl}`, error);
    return null;
  }
};