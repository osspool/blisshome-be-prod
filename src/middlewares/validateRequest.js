import { validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // No need to delete the file since it's in memory and not saved yet
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };