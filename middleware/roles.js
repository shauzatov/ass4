/**
 * Restrict access to admin users only
 * @middleware
 * @requires protect middleware must be used before this
 */
function adminOnly(req, res, next) {
  // Check if user exists (protect middleware should set this)
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required",
      details: ["Please login to access this resource"] 
    });
  }

  // Check if user has admin role
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      error: "Access denied",
      details: ["Admin privileges required for this action"] 
    });
  }

  next();
}

/**
 * Restrict access to specific roles
 * @middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentication required",
        details: ["Please login to access this resource"] 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access denied",
        details: [`Required role: ${roles.join(" or ")}`] 
      });
    }

    next();
  };
}

/**
 * Check if user owns the resource or is admin
 * @middleware
 * @param {string} resourceField - Field name in req.params to check (default: 'id')
 */
function ownerOrAdmin(resourceField = "id") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentication required" 
      });
    }

    const resourceId = req.params[resourceField];
    const userId = req.user._id.toString();

    // Allow if admin or owner
    if (req.user.role === "admin" || resourceId === userId) {
      return next();
    }

    return res.status(403).json({ 
      error: "Access denied",
      details: ["You can only access your own resources"] 
    });
  };
}

module.exports = { 
  adminOnly, 
  restrictTo,
  ownerOrAdmin 
};