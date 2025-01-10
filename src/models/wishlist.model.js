const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true });

// Prevent duplicate products in wishlist
wishlistSchema.pre('save', function(next) {
    this.products = [...new Set(this.products)];
    next();
});

export const Wishlist = mongoose.model('Wishlist', wishlistSchema); 