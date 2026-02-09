const Review = require("../models/Review");
const Product = require("../models/Product");
const mongoose = require("mongoose");

/**
 * Create new review
 * @route POST /api/reviews
 * @access Private
 */
async function createReview(req, res, next) {
  try {
    const { productId } = req.body;
    
    // Validate product exists
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        error: "Invalid product ID format" 
      });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        error: "Product not found" 
      });
    }

    // Create review with username from authenticated user
    const reviewData = {
      ...req.body,
      username: req.user.email // Username is set from authenticated user
    };
    
    const review = await Review.create(reviewData);
    
    res.status(201).json({ 
      success: true,
      message: "Review created successfully", 
      review 
    });
  } catch (error) {
    console.error("Create review error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: errors 
      });
    }
    
    next(error);
  }
}

/**
 * Get all reviews
 * @route GET /api/reviews
 * @access Public
 */
async function getReviews(req, res, next) {
  try {
    const { rating, minRating, maxRating } = req.query;
    
    // Build filter
    const filter = {};
    
    if (rating) {
      filter.rating = Number(rating);
    } else {
      if (minRating || maxRating) {
        filter.rating = {};
        if (minRating) filter.rating.$gte = Number(minRating);
        if (maxRating) filter.rating.$lte = Number(maxRating);
      }
    }
    
    const reviews = await Review.find(filter)
      .populate("productId", "name category imageUrl")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true,
      count: reviews.length, 
      reviews 
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    next(error);
  }
}

/**
 * Get reviews for specific product
 * @route GET /api/reviews/product/:productId
 * @access Public
 */
async function getReviewsByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        error: "Invalid product ID format" 
      });
    }
    
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    res.status(200).json({ 
      success: true,
      count: reviews.length,
      averageRating: avgRating.toFixed(1),
      reviews 
    });
  } catch (error) {
    console.error("Get reviews by product error:", error);
    next(error);
  }
}

/**
 * Get single review by ID
 * @route GET /api/reviews/:id
 * @access Public
 */
async function getReviewById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid review ID format" 
      });
    }
    
    const review = await Review.findById(id)
      .populate("productId", "name category");
    
    if (!review) {
      return res.status(404).json({ 
        error: "Review not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    console.error("Get review by ID error:", error);
    next(error);
  }
}

/**
 * Update review (Admin only)
 * @route PUT /api/reviews/:id
 * @access Private/Admin
 */
async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid review ID format" 
      });
    }
    
    // Remove empty fields
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== null && req.body[key] !== undefined && req.body[key] !== '') {
        updateData[key] = req.body[key];
      }
    });
    
    const review = await Review.findByIdAndUpdate(
      id, 
      updateData, 
      {
        new: true,
        runValidators: true,
      }
    );

    if (!review) {
      return res.status(404).json({ 
        error: "Review not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Review updated successfully", 
      review 
    });
  } catch (error) {
    console.error("Update review error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: errors 
      });
    }
    
    next(error);
  }
}

/**
 * Delete review (Admin only)
 * @route DELETE /api/reviews/:id
 * @access Private/Admin
 */
async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid review ID format" 
      });
    }
    
    const review = await Review.findByIdAndDelete(id);
    
    if (!review) {
      return res.status(404).json({ 
        error: "Review not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Review deleted successfully", 
      review 
    });
  } catch (error) {
    console.error("Delete review error:", error);
    next(error);
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