const Product = require("../models/Product");
const Review = require("../models/Review");
const mongoose = require("mongoose");

/**
 * Create new product (Admin only)
 * @route POST /api/products
 * @access Private/Admin
 */
async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({ 
      success: true,
      message: "Product created successfully", 
      product 
    });
  } catch (error) {
    console.error("Create product error:", error);
    
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
 * Get all products with optional filtering
 * @route GET /api/products
 * @access Public
 */
async function getProducts(req, res, next) {
  try {
    const { category, minPrice, maxPrice, search, featured } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    // Execute query
    const products = await Product.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true,
      count: products.length, 
      products 
    });
  } catch (error) {
    console.error("Get products error:", error);
    next(error);
  }
}

/**
 * Get single product by ID
 * @route GET /api/products/:id
 * @access Public
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid product ID format" 
      });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: "Product not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    next(error);
  }
}

/**
 * Update product (Admin only)
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid product ID format" 
      });
    }
    
    // Remove empty fields from update
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== null && req.body[key] !== undefined && req.body[key] !== '') {
        updateData[key] = req.body[key];
      }
    });
    
    const product = await Product.findByIdAndUpdate(
      id, 
      updateData, 
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!product) {
      return res.status(404).json({ 
        error: "Product not found" 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: "Product updated successfully", 
      product 
    });
  } catch (error) {
    console.error("Update product error:", error);
    
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
 * Delete product and associated reviews (Admin only)
 * @route DELETE /api/products/:id
 * @access Private/Admin
 */
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid product ID format" 
      });
    }
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: "Product not found" 
      });
    }

    // Delete all associated reviews
    const deletedReviews = await Review.deleteMany({ productId: id });
    
    res.status(200).json({
      success: true,
      message: "Product and associated reviews deleted successfully",
      product,
      deletedReviewsCount: deletedReviews.deletedCount
    });
  } catch (error) {
    console.error("Delete product error:", error);
    next(error);
  }
}

/**
 * Get product statistics (Admin only)
 * @route GET /api/products/stats/summary
 * @access Private/Admin
 */
async function getProductStats(req, res, next) {
  try {
    const totalProducts = await Product.countDocuments();
    const featuredProducts = await Product.countDocuments({ featured: true });
    
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          totalStock: { $sum: "$stock" }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        featuredProducts,
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    console.error("Get product stats error:", error);
    next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductStats
};