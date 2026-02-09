const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [2, 'Username must be at least 2 characters long'],
    maxlength: [50, 'Username must not exceed 50 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [5, 'Comment must be at least 5 characters long'],
    maxlength: [1000, 'Comment must not exceed 1000 characters']
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isHelpful: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient queries
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ username: 1 });

// Prevent duplicate reviews from same user for same product
reviewSchema.index({ productId: 1, username: 1 }, { unique: true });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for star display
reviewSchema.virtual('stars').get(function() {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Static method to get average rating for a product
reviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].count
    };
  }
  
  return { averageRating: 0, totalReviews: 0 };
};

// Static method to get rating distribution
reviewSchema.statics.getRatingDistribution = async function(productId) {
  const distribution = await this.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);
  
  // Initialize all ratings with 0
  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  distribution.forEach(item => {
    result[item._id] = item.count;
  });
  
  return result;
};

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = async function() {
  this.isHelpful += 1;
  return await this.save();
};

// Pre-save hook to ensure comment is trimmed
reviewSchema.pre('save', function(next) {
  if (this.isModified('comment')) {
    this.comment = this.comment.trim();
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);