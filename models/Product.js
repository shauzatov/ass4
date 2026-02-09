const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name must not exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description must not exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [1000000, 'Price seems unreasonably high']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Food', 'Other'],
      message: '{VALUE} is not a valid category'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be an integer'
    }
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/300x300?text=No+Image',
    validate: {
      validator: function(v) {
        // Basic URL validation
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search index

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock < 10) return 'Low Stock';
  return 'In Stock';
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Pre-save middleware to ensure price has max 2 decimal places
productSchema.pre('save', function(next) {
  if (this.isModified('price')) {
    this.price = Math.round(this.price * 100) / 100;
  }
  next();
});

// Static method to find products in stock
productSchema.statics.findInStock = function() {
  return this.find({ stock: { $gt: 0 }, isActive: true });
};

// Static method to find featured products
productSchema.statics.findFeatured = function() {
  return this.find({ featured: true, isActive: true });
};

// Static method to find by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

// Instance method to check if product is available
productSchema.methods.isAvailable = function() {
  return this.stock > 0 && this.isActive;
};

// Instance method to reduce stock
productSchema.methods.reduceStock = async function(quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;
  return await this.save();
};

// Instance method to increase stock
productSchema.methods.increaseStock = async function(quantity) {
  this.stock += quantity;
  return await this.save();
};

module.exports = mongoose.model('Product', productSchema);