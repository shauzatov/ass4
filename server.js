const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Product = require('./models/Product');
const Review = require('./models/Review');
const { validateProduct, validateReview } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online-store';

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.post('/products', validateProduct, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to create product', 
      details: error.message 
    });
  }
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve products', 
      details: error.message 
    });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    res.status(200).json(product);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid product ID format' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to retrieve product', 
      details: error.message 
    });
  }
});

app.put('/products/:id', validateProduct, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid product ID format' 
      });
    }
    res.status(400).json({ 
      error: 'Failed to update product', 
      details: error.message 
    });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    await Review.deleteMany({ productId: req.params.id });
    
    res.status(200).json({
      message: 'Product and associated reviews deleted successfully',
      product
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid product ID format' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to delete product', 
      details: error.message 
    });
  }
});

app.post('/reviews', validateReview, async (req, res) => {
  try {
    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    const review = new Review(req.body);
    await review.save();
    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to create review', 
      details: error.message 
    });
  }
});

app.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('productId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve reviews', 
      details: error.message 
    });
  }
});

app.get('/reviews/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 });
    res.status(200).json({
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve reviews', 
      details: error.message 
    });
  }
});

app.get('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('productId', 'name');
    
    if (!review) {
      return res.status(404).json({ 
        error: 'Review not found' 
      });
    }
    
    res.status(200).json(review);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid review ID format' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to retrieve review', 
      details: error.message 
    });
  }
});

app.put('/reviews/:id', validateReview, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!review) {
      return res.status(404).json({ 
        error: 'Review not found' 
      });
    }
    
    res.status(200).json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid review ID format' 
      });
    }
    res.status(400).json({ 
      error: 'Failed to update review', 
      details: error.message 
    });
  }
});

app.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({ 
        error: 'Review not found' 
      });
    }
    
    res.status(200).json({
      message: 'Review deleted successfully',
      review
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid review ID format' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to delete review', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📦 MongoDB URI: ${MONGODB_URI}`);
});
