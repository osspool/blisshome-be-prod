import express from "express";
import { getRecommendations } from "../controllers/recommendationController";

const router = express.Router();
// Public route
router.get("/:productId", getRecommendations);

export default router;
