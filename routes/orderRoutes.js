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


router.post("/", protect, validateOrder, createOrder);


router.get("/my", protect, getMyOrders);


router.get("/", protect, adminOnly, getAllOrders);


router.get("/:id", protect, getOrderById);


router.put("/:id/status", protect, adminOnly, updateOrderStatus);


router.put("/:id/cancel", protect, cancelOrder);

module.exports = router;