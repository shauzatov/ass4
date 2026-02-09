/**
 * Handle 404 errors
 * @middleware
 */
function notFound(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * Global error handler
 * @middleware
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Determine status code
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(statusCode).json({
      error: "Validation failed",
      details: errors,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }

  if (err.name === "CastError") {
    statusCode = 400;
    return res.status(statusCode).json({
      error: "Invalid ID format",
      details: [err.message],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    return res.status(statusCode).json({
      error: "Duplicate value",
      details: [`${field} already exists`],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    return res.status(statusCode).json({
      error: "Invalid token",
      details: [err.message],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    return res.status(statusCode).json({
      error: "Token expired",
      details: ["Please login again"],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }

  // Default error response
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    details: [err.message || "An unexpected error occurred"],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { notFound, errorHandler, asyncHandler };