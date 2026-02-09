const express = require("express");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roles");
const { validateReview } = require("../middleware/validation");

const {
  createReview,
  getReviews,
  getReviewsByProduct,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews
 * @access  Public
 * @query   rating, minRating, maxRating
 */
router.get("/", getReviews);

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get all reviews for a specific product
 * @access  Public
 */
router.get("/product/:productId", getReviewsByProduct);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get single review by ID
 * @access  Public
 */
router.get("/:id", getReviewById);

/**
 * @route   POST /api/reviews
 * @desc    Create new review
 * @access  Private
 * @note    Username is automatically set from authenticated user's email
 */
router.post(
  "/",
  protect,
  (req, res, next) => {
    // Set username from authenticated user
    req.body.username = req.user.email;
    next();
  },
  validateReview,
  createReview
);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update review
 * @access  Private/Admin
 */
router.put("/:id", protect, adminOnly, validateReview, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review (moderation)
 * @access  Private/Admin
 */
router.delete("/:id", protect, adminOnly, deleteReview);

module.exports = router;