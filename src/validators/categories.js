import { body } from "express-validator";

// Validation middleware for creating a category
export const validateCreateCategory = [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("parent")
      .optional()
      .isMongoId()
      .withMessage("Parent must be a valid ID"),
    body("description").optional().isString(),
    body("tags").optional().isString(),
  ];
  
  // Validation middleware for updating a category
export  const validateUpdateCategory = [
    body("parent")
      .optional()
      .isMongoId()
      .withMessage("Parent must be a valid ID"),
    body("description").optional().isString(),
    body("tags").optional().isString(),
    body("removeImage")
      .optional()
      .isBoolean()
      .withMessage("removeImage must be a boolean"),
  ];