const Review = require("../models/Review");
const Product = require("../models/Product");

async function createReview(req, res, next) {
  try {
    const product = await Product.findById(req.body.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const review = new Review(req.body);
    await review.save();
    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    res.status(400).json({ error: "Failed to create review", details: error.message });
  }
}

async function getReviews(req, res, next) {
  try {
    const reviews = await Review.find().populate("productId", "name").sort({ createdAt: -1 });
    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reviews", details: error.message });
  }
}

async function getReviewsByProduct(req, res, next) {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reviews", details: error.message });
  }
}

async function getReviewById(req, res, next) {
  try {
    const review = await Review.findById(req.params.id).populate("productId", "name");
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.status(200).json(review);
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(400).json({ error: "Invalid review ID format" });
    res.status(500).json({ error: "Failed to retrieve review", details: error.message });
  }
}

async function updateReview(req, res, next) {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!review) return res.status(404).json({ error: "Review not found" });

    res.status(200).json({ message: "Review updated successfully", review });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(400).json({ error: "Invalid review ID format" });
    res.status(400).json({ error: "Failed to update review", details: error.message });
  }
}

async function deleteReview(req, res, next) {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    res.status(200).json({ message: "Review deleted successfully", review });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(400).json({ error: "Invalid review ID format" });
    res.status(500).json({ error: "Failed to delete review", details: error.message });
  }
}

module.exports = {
  createReview,
  getReviews,
  getReviewsByProduct,
  getReviewById,
  updateReview,
  deleteReview,
};
