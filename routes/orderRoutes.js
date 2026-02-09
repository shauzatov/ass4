const express = require("express");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roles");
const { createOrder, getMyOrders, getAllOrders } = require("../controllers/orderController");
const { updateOrderStatus } = require("../controllers/orderController");


const router = express.Router();

router.post("/", protect, createOrder);

router.get("/my", protect, getMyOrders);

router.get("/", protect, adminOnly, getAllOrders);

router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
