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

function validateReview(req, res, next) {
  const { productId, rating, comment, username } = req.body;

  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ error: "Validation failed", details: ["productId is required"] });
  }

  if (!username || typeof username !== "string" || username.trim().length < 2) {
    return res.status(400).json({ error: "Validation failed", details: ["Username is required and must be at least 2 characters long"] });
  }

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: "Validation failed", details: ["rating must be integer 1..5"] });
  }

  if (!comment || typeof comment !== "string" || comment.trim().length < 3) {
    return res.status(400).json({ error: "Validation failed", details: ["comment is required"] });
  }

  next();
}


module.exports = {
  validateProduct,
  validateReview
};
