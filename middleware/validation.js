const validateProduct = (req, res, next) => {
  const { name, description, price, category } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description is required and must be at least 10 characters long');
  }

  if (price === undefined || price === null || price < 0) {
    errors.push('Price is required and cannot be negative');
  }

  if (!category) {
    errors.push('Category is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateReview = (req, res, next) => {
  const { productId, username, rating, comment } = req.body;
  const errors = [];

  if (!productId) {
    errors.push('Product ID is required');
  }

  if (!username || username.trim().length < 2) {
    errors.push('Username is required and must be at least 2 characters long');
  }

  if (!rating || rating < 1 || rating > 5) {
    errors.push('Rating is required and must be between 1 and 5');
  }

  if (!comment || comment.trim().length < 5) {
    errors.push('Comment is required and must be at least 5 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

module.exports = {
  validateProduct,
  validateReview
};
