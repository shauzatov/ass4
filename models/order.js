const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: { type: [orderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },

    totalPrice: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ["created", "completed", "cancelled"], default: "created" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
