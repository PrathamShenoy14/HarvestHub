import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
        default: ""
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters"],
        select: false  // Don't include password in queries by default
    },
    refreshToken: {
        type: String,
        select: false
    },
    role: {
        type: String,
        enum: ['customer', 'farmer', 'admin'],
        default: 'customer',
        required: true
    },
    farmDetails: {
        farmName: {
            type: String,
            required: function() { return this.role === 'farmer' }
        },
        description: {
            type: String,
            required: function() { return this.role === 'farmer' }
        },
        // Use the user's address as farm location
        farmPhotos: {
            type: [String],
            validate: {
                validator: function(photos) {
                    // Only apply validation if user is a farmer
                    if (this.role === 'farmer') {
                        return photos.length >= 1 && photos.length <= 5;
                    }
                    return true;
                },
                message: 'Farmers must have between 1 and 5 farm photos'
            },
            required: function() { 
                return this.role === 'farmer';
            }
        }
    },
    contactNumber: {
        type: String,
        trim: true
    },
    addresses: [{
        type: {
            type: String,
            default: 'Home'
        },
        street: String,
        city: String,
        state: String,
        pincode: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    // New fields for bank details
    bankAccountHolderName: {
        type: String,
        required: function() { return this.role === 'farmer' }
    },
    bankAccountNumber: {
        type: String,
        required: function() { return this.role === 'farmer' }
    },
    ifscCode: {
        type: String,
        required: function() { return this.role === 'farmer' }
    },
    bankName: {
        type: String,
        required: function() { return this.role === 'farmer' }
    }
}, {timestamps: true});

// Add index for location-based queries
userSchema.index({ "farmDetails.location.coordinates": "2dsphere" });

// Hash password before saving
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Add methods to userSchema
userSchema.methods = {
    // Compare password
    comparePassword: async function(plainPassword) {
        return await bcrypt.compare(plainPassword, this.password);
    },

    // Generate access token
    generateAccessToken: function() {
        return jwt.sign(
            {
                _id: this._id,
                email: this.email,
                role: this.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
    },

    // Generate refresh token
    generateRefreshToken: function() {
        return jwt.sign(
            {
                _id: this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
    }
}

userSchema.pre('save', function(next) {
    if (this.role === 'farmer' && !this.farmDetails) {
        next(new Error('Farm details are required for farmer accounts'));
    }
    if (this.role !== 'farmer' && this.farmDetails) {
        this.farmDetails = undefined; // Remove farmDetails if role is not farmer
    }
    next();
});


export const User = mongoose.model("User", userSchema);

