const express = require("express");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roles");
const { validateOrder } = require("../middleware/validation");

const { 
  createOrder, 
  getMyOrders, 
  getAllOrders, 
  getOrderById,
  updateOrderStatus,
  cancelOrder
} = require("../controllers/orderController");

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 * @body    { items: [{ productId, quantity }] }
 */
router.post("/", protect, validateOrder, createOrder);

/**
 * @route   GET /api/orders/my
 * @desc    Get current user's orders
 * @access  Private
 */
router.get("/my", protect, getMyOrders);

/**
 * @route   GET /api/orders
 * @desc    Get all orders (admin only)
 * @access  Private/Admin
 * @query   status, userId
 */
router.get("/", protect, adminOnly, getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private (own orders) / Admin (all orders)
 */
router.get("/:id", protect, getOrderById);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 * @body    { status: "created" | "completed" | "cancelled" }
 */
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel own order
 * @access  Private
 */
router.put("/:id/cancel", protect, cancelOrder);

module.exports = router;