const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect routes - verify JWT token
 * @middleware
 */
async function protect(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Authentication required",
        details: ["No token provided. Please login first."] 
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: "Authentication required",
        details: ["Invalid token format"] 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ 
          error: "Token expired",
          details: ["Your session has expired. Please login again."] 
        });
      }
      
      return res.status(401).json({ 
        error: "Invalid token",
        details: ["Token verification failed"] 
      });
    }

    // Find user
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication failed",
        details: ["User no longer exists"] 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ 
      error: "Authentication failed",
      details: ["An error occurred during authentication"] 
    });
  }
}

/**
 * Optional auth - attach user if token exists, but don't require it
 * @middleware
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Token invalid or expired, but that's okay for optional auth
      console.log("Optional auth: Invalid token, continuing without user");
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next();
  }
}

module.exports = { protect, optionalAuth };