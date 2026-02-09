const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
function signToken(user) {
  return jwt.sign(
    { 
      id: user._id.toString(), 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/**
 * Validate email format
 * @param {String} email
 * @returns {Boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Register new user
 * @route POST /api/auth/register
 * @access Public
 */
async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || typeof email !== "string") {
      return res.status(400).json({ 
        error: "Validation failed",
        details: ["Email is required and must be a string"] 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: ["Invalid email format"] 
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ 
        error: "Validation failed",
        details: ["Password is required and must be a string"] 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: ["Password must be at least 6 characters long"] 
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        error: "Registration failed",
        details: ["Email already in use"] 
      });
    }

    // Create user with validated role
    const userRole = role === "admin" ? "admin" : "user";
    const user = await User.create({
      email: normalizedEmail,
      password,
      role: userRole,
    });

    // Generate token
    const token = signToken(user);

    // Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    next(error);
  }
}

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: ["Email and password are required"] 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: ["Invalid email format"] 
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication failed",
        details: ["Invalid email or password"] 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: "Authentication failed",
        details: ["Invalid email or password"] 
      });
    }

    // Generate token
    const token = signToken(user);

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
}

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("GetMe error:", error);
    next(error);
  }
}

module.exports = { register, login, getMe };