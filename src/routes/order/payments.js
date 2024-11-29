// routes/paymentMethodRoutes.js
import express from "express";
import {
  getPaymentDetails,
  updatePaymentStatus
} from "#controllers/order/paymentController.js";
import { protect, authorize } from "#middlewares/authMiddleware.js";

const router = express.Router();


router.put(
  "/:paymentId",
  protect,
  authorize("admin"),
  updatePaymentStatus
);

router.get("/:paymentId", protect, getPaymentDetails);


export default router;
