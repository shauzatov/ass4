const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: [true, "Product reference is required"]
    },
    quantity: { 
      type: Number, 
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer"
      }
    },
    priceAtPurchase: { 
      type: Number, 
      required: [true, "Price at purchase is required"],
      min: [0, "Price cannot be negative"]
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User reference is required"],
      index: true
    },
    items: { 
      type: [orderItemSchema], 
      required: [true, "Order items are required"],
      validate: {
        validator: function(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must contain at least one item"
      }
    },
    totalPrice: { 
      type: Number, 
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"]
    },
    status: { 
      type: String, 
      enum: {
        values: ["created", "completed", "cancelled"],
        message: "{VALUE} is not a valid status"
      },
      default: "created",
      index: true
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "cash"],
      default: "credit_card"
    },
    notes: {
      type: String,
      maxlength: [500, "Notes must not exceed 500 characters"]
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order number (formatted ID)
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for formatted total price
orderSchema.virtual('formattedTotal').get(function() {
  return `$${this.totalPrice.toFixed(2)}`;
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to ensure total price has max 2 decimal places
orderSchema.pre('save', function(next) {
  if (this.isModified('totalPrice')) {
    this.totalPrice = Math.round(this.totalPrice * 100) / 100;
  }
  next();
});

// Pre-save middleware to recalculate total if items changed
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalPrice = this.items.reduce(
      (sum, item) => sum + (item.priceAtPurchase * item.quantity),
      0
    );
    this.totalPrice = Math.round(this.totalPrice * 100) / 100;
  }
  next();
});

// Static method to get orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get user's orders
orderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to get recent orders
orderSchema.statics.findRecent = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return this.find({ createdAt: { $gte: cutoffDate } }).sort({ createdAt: -1 });
};

// Static method to calculate total revenue
orderSchema.statics.calculateRevenue = async function(filter = {}) {
  const result = await this.aggregate([
    { $match: { status: "completed", ...filter } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, orderCount: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    return {
      totalRevenue: Math.round(result[0].totalRevenue * 100) / 100,
      orderCount: result[0].orderCount
    };
  }
  
  return { totalRevenue: 0, orderCount: 0 };
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return this.status === "created";
};

// Instance method to check if order is editable
orderSchema.methods.isEditable = function() {
  return this.status === "created";
};

// Instance method to complete order
orderSchema.methods.complete = async function() {
  if (this.status === "completed") {
    throw new Error("Order is already completed");
  }
  if (this.status === "cancelled") {
    throw new Error("Cannot complete a cancelled order");
  }
  this.status = "completed";
  return await this.save();
};

// Instance method to cancel order
orderSchema.methods.cancel = async function() {
  if (this.status === "cancelled") {
    throw new Error("Order is already cancelled");
  }
  if (this.status === "completed") {
    throw new Error("Cannot cancel a completed order");
  }
  this.status = "cancelled";
  return await this.save();
};

module.exports = mongoose.model("Order", orderSchema);