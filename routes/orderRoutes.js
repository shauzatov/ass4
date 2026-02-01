const express = require("express");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/roles");
const { createOrder, getMyOrders, getAllOrders } = require("../controllers/orderController");

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/my", protect, getMyOrders);

router.get("/", protect, adminOnly, getAllOrders);

module.exports = router;
