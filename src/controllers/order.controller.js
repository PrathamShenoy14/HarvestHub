import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create order from cart
export const createOrder = async (req, res) => {
    try {
        const { 
            shippingAddress, 
            paymentMethod,
            deliveryNotes 
        } = req.body;

        // Validate shipping address
        if (!shippingAddress?.street || 
            !shippingAddress?.city || 
            !shippingAddress?.state || 
            !shippingAddress?.pincode || 
            !shippingAddress?.phone) {
            return res.status(400).json({
                success: false,
                message: "Complete shipping address is required"
            });
        }

        // Get cart
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Validate stock for all items
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is out of stock or has insufficient quantity`
                });
            }
        }

        // Create orders grouped by farmer
        const farmerOrders = {};
        
        cart.items.forEach(item => {
            const farmerId = item.farmer.toString();
            
            if (!farmerOrders[farmerId]) {
                farmerOrders[farmerId] = {
                    items: [],
                    totalAmount: 0
                };
            }
            
            farmerOrders[farmerId].items.push({
                product: item.product._id,
                quantity: item.quantity,
                price: item.price,
                unit: item.product.unit
            });
            
            farmerOrders[farmerId].totalAmount += item.price * item.quantity;
        });

        // Create orders for each farmer
        const orders = [];
        for (const [farmerId, orderData] of Object.entries(farmerOrders)) {
            const order = await Order.create({
                customer: req.user._id,
                farmer: farmerId,
                items: orderData.items,
                totalAmount: orderData.totalAmount,
                shippingAddress,
                paymentMethod,
                deliveryNotes,
                status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
            });

            // Update product stock
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantity } }
                );
            }

            orders.push(order);
        }

        // Clear cart after successful order creation
        cart.items = [];
        await cart.save();

        // Populate order details
        const populatedOrders = await Order.find({
            _id: { $in: orders.map(order => order._id) }
        }).populate([
            { path: 'customer', select: 'username email' },
            { path: 'farmer', select: 'username email' },
            { path: 'items.product' }
        ]);

        return res.status(201).json({
            success: true,
            message: "Orders created successfully",
            orders: populatedOrders
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while creating order"
        });
    }
};

// Get all orders (for customer)
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate([
                { path: 'farmer', select: 'username email' },
                { path: 'items.product' }
            ])
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching orders"
        });
    }
};

// Get farmer orders
export const getFarmerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ farmer: req.user._id })
            .populate([
                { path: 'customer', select: 'username email' },
                { path: 'items.product' }
            ])
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching orders"
        });
    }
};

// Get single order
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate([
                { path: 'customer', select: 'username email' },
                { path: 'farmer', select: 'username email' },
                { path: 'items.product' }
            ]);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check if user is authorized to view this order
        if (order.customer._id.toString() !== req.user._id.toString() && 
            order.farmer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view this order"
            });
        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching order"
        });
    }
};

// Update order status (farmer only)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check if user is the farmer
        if (order.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only farmer can update order status"
            });
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        };

        if (!validTransitions[order.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status transition"
            });
        }

        order.status = status;
        
        // If order is cancelled, restore product stock
        if (status === 'cancelled') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.quantity } }
                );
            }
        }

        await order.save();

        // Populate order details
        await order.populate([
            { path: 'customer', select: 'username email' },
            { path: 'farmer', select: 'username email' },
            { path: 'items.product' }
        ]);

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating order status"
        });
    }
};

// Cancel order (customer only)
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check if user is the customer
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only customer can cancel order"
            });
        }

        // Check if order can be cancelled
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: "Order cannot be cancelled at this stage"
            });
        }

        order.status = 'cancelled';

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        await order.save();

        // Populate order details
        await order.populate([
            { path: 'customer', select: 'username email' },
            { path: 'farmer', select: 'username email' },
            { path: 'items.product' }
        ]);

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while cancelling order"
        });
    }
}; 