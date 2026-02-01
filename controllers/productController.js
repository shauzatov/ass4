const Product = require("../models/Product");
const Review = require("../models/Review");

async function createProduct(req, res, next) {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res.status(400).json({ error: "Failed to create product", details: error.message });
  }
}

async function getProducts(req, res, next) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ count: products.length, products });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve products", details: error.message });
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(400).json({ error: "Invalid product ID format" });
    res.status(500).json({ error: "Failed to retrieve product", details: error.message });
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(400).json({ error: "Invalid product ID format" });
    res.status(400).json({ error: "Failed to update product", details: error.message });
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await Review.deleteMany({ productId: req.params.id });

    res.status(200).json({
      message: "Product and associated reviews deleted successfully",
      product,
    });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(400).json({ error: "Invalid product ID format" });
    res.status(500).json({ error: "Failed to delete product", details: error.message });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
