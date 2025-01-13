import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if user is trying to buy their own product
        if (product.farmer.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot buy your own product"
            });
        }

        // Check stock
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Not enough stock available"
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

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex !== -1) {
            // Update quantity if product exists
            cart.items[existingItemIndex].quantity = quantity;
            cart.items[existingItemIndex].price = product.price;
        } else {
            // Add new item if product doesn't exist
            cart.items.push({
                product: productId,
                quantity,
                price: product.price,
                farmer: product.farmer
            });
        }

        await cart.save();

        // Populate product and farmer details
        await cart.populate([
            { path: 'items.product' },
            { path: 'items.farmer', select: 'username email' }
        ]);

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating cart"
        });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Remove item from cart
        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        await cart.save();

        // Populate product and farmer details
        await cart.populate([
            { path: 'items.product' },
            { path: 'items.farmer', select: 'username email' }
        ]);

        return res.status(200).json({
            success: true,
            message: "Item removed from cart",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while removing item from cart"
        });
    }
};

export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate([
                { path: 'items.product' },
                { path: 'items.farmer', select: 'username email' }
            ]);

        if (!cart) {
            return res.status(200).json({
                success: true,
                cart: {
                    items: [],
                    totalItems: 0,
                    totalAmount: 0
                }
            });
        }

        return res.status(200).json({
            success: true,
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching cart"
        });
    }
};

export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = [];
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while clearing cart"
        });
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid quantity"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check stock
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Not enough stock available"
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = product.price;

        await cart.save();

        // Populate product and farmer details
        await cart.populate([
            { path: 'items.product' },
            { path: 'items.farmer', select: 'username email' }
        ]);

        return res.status(200).json({
            success: true,
            message: "Quantity updated successfully",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating quantity"
        });
    }
}; 