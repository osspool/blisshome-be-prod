// src/routes/auth.js
import express from "express";
import {
  forgotPassword,
  getProfile,
  login,
  refreshToken,
  register,
  resetPassword,
  // forgotPassword,
  // resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Auth route" });
});
router.post("/getUser", getProfile);
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
// password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
