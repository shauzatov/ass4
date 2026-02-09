/**
 * Validate product data
 * @middleware
 */
const validateProduct = (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  const errors = [];

  // Name validation
  if (name !== undefined) {
    if (!name || typeof name !== "string") {
      errors.push("Name must be a non-empty string");
    } else if (name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    } else if (name.trim().length > 100) {
      errors.push("Name must not exceed 100 characters");
    }
  }

  // Description validation
  if (description !== undefined) {
    if (!description || typeof description !== "string") {
      errors.push("Description must be a non-empty string");
    } else if (description.trim().length < 10) {
      errors.push("Description must be at least 10 characters long");
    } else if (description.trim().length > 2000) {
      errors.push("Description must not exceed 2000 characters");
    }
  }

  // Price validation
  if (price !== undefined) {
    const numPrice = Number(price);
    if (isNaN(numPrice)) {
      errors.push("Price must be a valid number");
    } else if (numPrice < 0) {
      errors.push("Price cannot be negative");
    } else if (numPrice > 1000000) {
      errors.push("Price seems unreasonably high");
    }
  }

  // Category validation
  if (category !== undefined) {
    const validCategories = [
      'Electronics', 'Clothing', 'Books', 'Home & Garden', 
      'Sports', 'Toys', 'Food', 'Other'
    ];
    if (!category || typeof category !== "string") {
      errors.push("Category must be a non-empty string");
    } else if (!validCategories.includes(category)) {
      errors.push(`Category must be one of: ${validCategories.join(", ")}`);
    }
  }

  // Stock validation
  if (stock !== undefined) {
    const numStock = Number(stock);
    if (isNaN(numStock)) {
      errors.push("Stock must be a valid number");
    } else if (!Number.isInteger(numStock)) {
      errors.push("Stock must be an integer");
    } else if (numStock < 0) {
      errors.push("Stock cannot be negative");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: errors 
    });
  }

  next();
};

/**
 * Validate review data
 * @middleware
 */
function validateReview(req, res, next) {
  const { productId, rating, comment, username } = req.body;
  const errors = [];

  // Product ID validation
  if (!productId) {
    errors.push("Product ID is required");
  } else if (typeof productId !== "string") {
    errors.push("Product ID must be a string");
  }

  // Username validation (if not set by middleware)
  if (!username) {
    errors.push("Username is required");
  } else if (typeof username !== "string") {
    errors.push("Username must be a string");
  } else if (username.trim().length < 2) {
    errors.push("Username must be at least 2 characters long");
  } else if (username.trim().length > 50) {
    errors.push("Username must not exceed 50 characters");
  }

  // Rating validation
  if (rating === undefined || rating === null) {
    errors.push("Rating is required");
  } else {
    const numRating = Number(rating);
    if (isNaN(numRating)) {
      errors.push("Rating must be a number");
    } else if (!Number.isInteger(numRating)) {
      errors.push("Rating must be an integer");
    } else if (numRating < 1 || numRating > 5) {
      errors.push("Rating must be between 1 and 5");
    }
  }

  // Comment validation
  if (!comment) {
    errors.push("Comment is required");
  } else if (typeof comment !== "string") {
    errors.push("Comment must be a string");
  } else if (comment.trim().length < 5) {
    errors.push("Comment must be at least 5 characters long");
  } else if (comment.trim().length > 1000) {
    errors.push("Comment must not exceed 1000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: errors 
    });
  }

  next();
}

/**
 * Validate order data
 * @middleware
 */
function validateOrder(req, res, next) {
  const { items } = req.body;
  const errors = [];

  // Items validation
  if (!items) {
    errors.push("Items are required");
  } else if (!Array.isArray(items)) {
    errors.push("Items must be an array");
  } else if (items.length === 0) {
    errors.push("Items array cannot be empty");
  } else {
    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      
      const quantity = Number(item.quantity);
      if (isNaN(quantity)) {
        errors.push(`Item ${index + 1}: Quantity must be a number`);
      } else if (!Number.isInteger(quantity)) {
        errors.push(`Item ${index + 1}: Quantity must be an integer`);
      } else if (quantity < 1) {
        errors.push(`Item ${index + 1}: Quantity must be at least 1`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: errors 
    });
  }

  next();
}

/**
 * Sanitize user input to prevent XSS
 * @middleware
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key].replace(/[<>]/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }
  
  next();
}

module.exports = {
  validateProduct,
  validateReview,
  validateOrder,
  sanitizeInput
};