import { MulterError } from "multer";

const errorHandler = (err, req, res, next) => {
  if (err instanceof MulterError) {
    // Handle multer-specific errors
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Handle other errors
    return res.status(500).json({ message: err.message });
  }
  next();
}

export default errorHandler;
