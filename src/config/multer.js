// config/multer.js
import multer from "multer";
import path from "path";

// Set storage engine to memory
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
  // Allowed extensions (now including webp)
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Allowed MIME types (now including webp)
  const mimetypes = /image\/(jpeg|jpg|png|gif|webp)/;
  
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = mimetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Supported image formats: JPEG, PNG, GIF, WebP"));
  }
}

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;