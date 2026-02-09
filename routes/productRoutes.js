const express = require("express");
const { validateProduct } = require("../middleware/validation");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roles");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductStats
} = require("../controllers/productController");

const router = express.Router();

/**
 * @route   GET /api/products/stats/summary
 * @desc    Get product statistics
 * @access  Private/Admin
 */
router.get("/stats/summary", protect, adminOnly, getProductStats);

/**
 * @route   GET /api/products
 * @desc    Get all products (with optional filters)
 * @access  Public
 * @query   category, minPrice, maxPrice, search, featured
 */
router.get("/", getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get("/:id", getProductById);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private/Admin
 */
router.post("/", protect, adminOnly, validateProduct, createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
router.put("/:id", protect, adminOnly, validateProduct, updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product and associated reviews
 * @access  Private/Admin
 */
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;