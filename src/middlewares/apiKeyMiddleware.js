import dotenv from "dotenv";

dotenv.config();

const VALID_API_KEYS = process.env.X_API_KEYS
  ? process.env.X_API_KEYS.split(",").map((key) => key.trim())
  : [];

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.header("X-API-Key");
//   console.log(apiKey, VALID_API_KEYS);
  if (!apiKey) {
    return res.status(401).json({ message: "Access denied. Missing API key." });
  }

  if (!VALID_API_KEYS.includes(apiKey)) {
    return res.status(403).json({ message: "Access denied. Invalid API key." });
  }

  next();
};

export default apiKeyMiddleware;