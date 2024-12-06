// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";

// import helmet from 'helmet';
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import addressRoutes from "./routes/common/addresses.js";
import categoryRoutes from "./routes/product/categories.js";
import productRoutes from "./routes/product/products.js";
import cartRoutes from "./routes/order/carts.js";
import couponRoutes from "./routes/order/coupons.js";
import deliveryPricingRoutes from "./routes/order/deliveryPricing.js";
import paymentMethodsRoutes from "./routes/order/paymentMethods.js";
import paymentRoutes from "./routes/order/payments.js";
import customerRoutes from "./routes/common/customers.js"
import dashboardRoutes from "./routes/common/dashboard.js";
import recommendationRoutes from "./routes/product/recommendations.js";
// import landingPageRoutes from "./routes/landingPage.js";
import orderRoutes from "./routes/order/orders.js";

// Middleware
import errorHandler from "./middlewares/errorHandler.js";
import apiKeyMiddleware from "./middlewares/apiKeyMiddleware.js";

dotenv.config();
connectDB();

// Start the scheduler
// scheduleMonthlyAggregation();


const app = express();

// Security HTTP headers
// app.use(helmet());

// Data sanitization against NoSQL query injection and XSS
// import mongoSanitize from "express-mongo-sanitize";
// import xss from "xss-clean";

// app.use(mongoSanitize());
// app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Trust proxy if behind a proxy (e.g., Heroku, Nginx)
app.set("trust proxy", 1);

// app.use(
//     cors({
//       origin: [process.env.FRONTEND_URL, process.env.BACKEND_URL],
//       credentials: true,
//     })
//   );

app.use(cors());
// For all other routes, use JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
// Get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(
  "/images/products",
  express.static(path.join(__dirname, "../uploads/images/products"))
);
app.use(
  "/images/categories",
  express.static(path.join(__dirname, "../uploads/images/categories"))
);
app.use(
  "/images/landing",
  express.static(path.join(__dirname, "../uploads/images/landing"))
);

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/products", apiKeyMiddleware, productRoutes);
app.use("/api/categories", apiKeyMiddleware,  categoryRoutes);
app.use("/api/carts", apiKeyMiddleware, cartRoutes);
// app.use("/api/admin/landing", landingPageRoutes);
app.use('/api/addresses', apiKeyMiddleware, addressRoutes);
app.use("/api/orders", apiKeyMiddleware, orderRoutes);
app.use("/api/coupons", apiKeyMiddleware, couponRoutes);
app.use("/api/payment-methods", apiKeyMiddleware, paymentMethodsRoutes);
app.use("/api/payments", apiKeyMiddleware, paymentRoutes);
app.use("/api/customers", apiKeyMiddleware, customerRoutes);
app.use("/api/admin", apiKeyMiddleware, dashboardRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use("/api/delivery-pricing", apiKeyMiddleware, deliveryPricingRoutes);

// Error Handling Middleware
app.use(errorHandler);
export default app;
