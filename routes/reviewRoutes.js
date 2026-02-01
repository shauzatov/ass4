const express = require("express");
const { validateReview } = require("../middleware/validation");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roles");

const {
  createReview,
  getReviews,
  getReviewsByProduct,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/", getReviews);
router.get("/product/:productId", getReviewsByProduct);
router.get("/:id", getReviewById);

router.post("/", protect, adminOnly, validateReview, createReview);
router.put("/:id", protect, adminOnly, validateReview, updateReview);
router.delete("/:id", protect, adminOnly, deleteReview);

module.exports = router;
