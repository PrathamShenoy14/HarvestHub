import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";

// Add to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Get or create wishlist
        let wishlist = await Wishlist.findOne({ user: req.user._id });
        
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user._id,
                products: [productId]
            });
        } else {
            // Add product if not already in wishlist
            if (!wishlist.products.includes(productId)) {
                wishlist.products.push(productId);
                await wishlist.save();
            }
        }

        await wishlist.populate('products');

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist",
            wishlist
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while adding to wishlist"
        });
    }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        wishlist.products = wishlist.products.filter(
            product => product.toString() !== productId
        );

        await wishlist.save();
        await wishlist.populate('products');

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist",
            wishlist
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while removing from wishlist"
        });
    }
};

// Get wishlist
export const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate('products');

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                wishlist: {
                    products: []
                }
            });
        }

        return res.status(200).json({
            success: true,
            wishlist
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching wishlist"
        });
    }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        wishlist.products = [];
        await wishlist.save();

        return res.status(200).json({
            success: true,
            message: "Wishlist cleared",
            wishlist
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while clearing wishlist"
        });
    }
};

// Move to cart
export const moveToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check stock
        if (product.stock < 1) {
            return res.status(400).json({
                success: false,
                message: "Product out of stock"
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: []
            });
        }

        // Add to cart
        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.price = product.price;
        } else {
            cart.items.push({
                product: productId,
                quantity: 1,
                price: product.price,
                farmer: product.farmer
            });
        }

        await cart.save();

        // Remove from wishlist
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (wishlist) {
            wishlist.products = wishlist.products.filter(
                product => product.toString() !== productId
            );
            await wishlist.save();
        }

        // Populate cart details
        await cart.populate([
            { path: 'items.product' },
            { path: 'items.farmer', select: 'username email' }
        ]);

        return res.status(200).json({
            success: true,
            message: "Product moved to cart",
            cart,
            wishlist
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while moving to cart"
        });
    }
}; 