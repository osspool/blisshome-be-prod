import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Access denied");

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Access denied");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).send("User not found");
    next();
  } catch (err) {
    res.status(403).send("Invalid token");
  }
};

// Role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.role === "superadmin") {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Role ${req.user.role} not allowed` });
    }
    next();
  };
};

export { protect, authorize };
