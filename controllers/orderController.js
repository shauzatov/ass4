const Order = require("../models/order");
const Product = require("../models/Product");

async function createOrder(req, res, next) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty array" });
    }

    const normalized = items.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity || 1),
    }));

    for (const it of normalized) {
      if (!it.productId || typeof it.productId !== "string") {
        return res.status(400).json({ error: "each item must include productId" });
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1) {
        return res.status(400).json({ error: "quantity must be an integer >= 1" });
      }
    }

    const productIds = normalized.map((x) => x.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: "one or more productId are invalid" });
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = normalized.map((it) => {
      const p = productMap.get(it.productId);
      return {
        product: p._id,
        quantity: it.quantity,
        priceAtPurchase: p.price,
      };
    });

    const totalPrice = orderItems.reduce(
      (sum, it) => sum + it.priceAtPurchase * it.quantity,
      0
    );

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      status: "created",
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (e) {
    next(e);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json({ count: orders.length, orders });
  } catch (e) {
    next(e);
  }
}

async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .populate("user", "email role")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json({ count: orders.length, orders });
  } catch (e) {
    next(e);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["created", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("user", "email role")
      .populate("items.product", "name price");

    if (!updated) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order status updated", order: updated });
  } catch (e) {
    next(e);
  }
}


module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus };



