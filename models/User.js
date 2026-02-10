const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: [true, "Email is required"],
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    password: { 
      type: String, 
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false // Don't include password in queries by default
    },
    role: { 
      type: String, 
      enum: {
        values: ["user", "admin"],
        message: "Role must be either 'user' or 'admin'"
      },
      default: "user" 
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    // Only hash if password is modified
    if (!this.isModified("password")) {
      return next();
    }

    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt
  };
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

module.exports = mongoose.model("User", userSchema);