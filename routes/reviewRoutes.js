const express = require("express");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roles");
const { validateReview } = require("../middleware/validation");

const {
  createReview,
  getReviews,
  getReviewsByProduct,
  getReviewById,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

// public
router.get("/", getReviews);
router.get("/product/:productId", getReviewsByProduct);
router.get("/:id", getReviewById);

//user can create review
router.post(
  "/",
  protect,
  (req, res, next) => {
    req.body.username = req.user.email;
    next();
  },
  validateReview,
  createReview
);

// admin moderation
router.delete("/:id", protect, adminOnly, deleteReview);

module.exports = router;
