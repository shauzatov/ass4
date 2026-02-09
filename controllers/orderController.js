const Order = require("../models/order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

/**
 * Create new order
 * @route POST /api/orders
 * @access Private
 */
async function createOrder(req, res, next) {
  try {
    const { items } = req.body;

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: ["Items must be a non-empty array"] 
      });
    }

    // Normalize and validate each item
    const normalized = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity || 1),
    }));

    // Validate item structure
    for (const item of normalized) {
      if (!item.productId || typeof item.productId !== "string") {
        return res.status(400).json({ 
          error: "Validation failed",
          details: ["Each item must include a valid productId"] 
        });
      }
      
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: [`Invalid productId format: ${item.productId}`] 
        });
      }
      
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: ["Quantity must be a positive integer"] 
        });
      }
    }

    // Fetch all products
    const productIds = normalized.map((x) => x.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Check if all products exist
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p._id.toString());
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({ 
        error: "Validation failed",
        details: [`Products not found: ${missingIds.join(", ")}`] 
      });
    }

    // Create product map for quick lookup
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Check stock availability and build order items
    const orderItems = [];
    const stockErrors = [];

    for (const item of normalized) {
      const product = productMap.get(item.productId);
      
      // Check stock
      if (product.stock < item.quantity) {
        stockErrors.push(
          `Insufficient stock for ${product.name}: requested ${item.quantity}, available ${product.stock}`
        );
        continue;
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
    }

    // If there are stock errors, return them
    if (stockErrors.length > 0) {
      return res.status(400).json({ 
        error: "Stock validation failed",
        details: stockErrors 
      });
    }

    // Calculate total price
    const totalPrice = orderItems.reduce(
      (sum, item) => sum + item.priceAtPurchase * item.quantity,
      0
    );

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      status: "created",
    });

    // Update product stock
    for (const item of normalized) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name price category imageUrl")
      .populate("user", "email");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    next(error);
  }
}

/**
 * Get current user's orders
 * @route GET /api/orders/my
 * @access Private
 */
async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name price category imageUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      count: orders.length, 
      orders 
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    next(error);
  }
}

/**
 * Get all orders (Admin only)
 * @route GET /api/orders
 * @access Private/Admin
 */
async function getAllOrders(req, res, next) {
  try {
    const { status, userId } = req.query;
    
    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }
    
    const orders = await Order.find(filter)
      .populate("user", "email role")
      .populate("items.product", "name price category")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      count: orders.length, 
      orders 
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    next(error);
  }
}

/**
 * Get single order by ID
 * @route GET /api/orders/:id
 * @access Private
 */
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid order ID format" 
      });
    }
    
    const order = await Order.findById(id)
      .populate("user", "email role")
      .populate("items.product", "name price category imageUrl");
    
    if (!order) {
      return res.status(404).json({ 
        error: "Order not found" 
      });
    }
    
    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied",
        details: ["You can only view your own orders"] 
      });
    }
    
    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    next(error);
  }
}

/**
 * Update order status (Admin only)
 * @route PUT /api/orders/:id/status
 * @access Private/Admin
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid order ID format" 
      });
    }
    
    // Validate status
    const allowedStatuses = ["created", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: [`Invalid status. Allowed: ${allowedStatuses.join(", ")}`] 
      });
    }

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ 
        error: "Order not found" 
      });
    }

    // If cancelling, restore stock
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    // Update status
    order.status = status;
    await order.save();

    // Populate and return
    const updated = await Order.findById(id)
      .populate("user", "email role")
      .populate("items.product", "name price category");

    res.status(200).json({ 
      success: true,
      message: "Order status updated successfully", 
      order: updated 
    });
  } catch (error) {
    console.error("Update order status error:", error);
    next(error);
  }
}

/**
 * Cancel order (User can cancel own orders)
 * @route PUT /api/orders/:id/cancel
 * @access Private
 */
async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: "Invalid order ID format" 
      });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ 
        error: "Order not found" 
      });
    }
    
    // Check ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: "Access denied",
        details: ["You can only cancel your own orders"] 
      });
    }
    
    // Check if already cancelled or completed
    if (order.status === "cancelled") {
      return res.status(400).json({ 
        error: "Order already cancelled" 
      });
    }
    
    if (order.status === "completed") {
      return res.status(400).json({ 
        error: "Cannot cancel completed order" 
      });
    }
    
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }
    
    // Update status
    order.status = "cancelled";
    await order.save();
    
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    next(error);
  }
}

module.exports = { 
  createOrder, 
  getMyOrders, 
  getAllOrders, 
  getOrderById,
  updateOrderStatus,
  cancelOrder
};