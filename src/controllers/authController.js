// src/controllers/authController.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateTokens } from "../utils/generateToken.js";

const register = async (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  // console.log(req.body);
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      role,
    });
    await user.save();

    res.json({ message: "User registered" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error registering user");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { token, refreshToken } = generateTokens(user);
    // console.log("logging in", user);

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error logging in");
  }
};

const refreshToken = async (req, res) => {
  const { token: refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).send("Refresh token required");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).send("Invalid refresh token");
    }

    const { token, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error refreshing token");
  }
};

const getProfile = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user details
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const token = crypto.randomBytes(20).toString("hex");
//     user.resetPasswordToken = token;
//     user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//     await user.save();

//     const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

//     const { data, error } = await resend.emails.send({
//       from: process.env.RESEND_EMAIL,
//       to: email,
//       subject: "Password Reset Request",
//       html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>
//              <p>This link will expire in 1 hour.</p>
//              <p>If you didn't request this, please ignore this email.</p>`,
//     });

//     if (error) {
//       console.error("Error sending email:", error);
//       return res.status(500).json({ message: "Error sending reset email" });
//     }

//     res.json({ message: "Password reset email sent" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const resetPassword = async (req, res) => {
//   const { token, newPassword } = req.body;

//   try {
//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     res.json({ message: "Password has been reset" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export {
  register,
  login,
  refreshToken,
  getProfile,
  // forgotPassword,
  // resetPassword,
};
