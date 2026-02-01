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
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/", protect, adminOnly, validateProduct, createProduct);
router.put("/:id", protect, adminOnly, validateProduct, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
