// src/controllers/payment.controller.js
import { razorpay } from "../config/razorpay.config.js"; // Import Razorpay configuration
import { Order } from "../models/order.model.js"; // Import Order model
import crypto from "crypto"; // Import crypto for signature verification

// Initialize payment
export const initializePayment = async (req, res) => {
    try {
        const { orderIds } = req.body; // Expecting an array of order IDs

        // Fetch all orders
        const orders = await Order.find({
            _id: { $in: orderIds },
            customer: req.user._id,
            paymentStatus: "pending"
        });

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: "No pending orders found"
            });
        }

        // Calculate total amount
        const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: totalAmount * 100, // Convert to paise
            currency: "INR",
            receipt: orderIds.join('-'), // Combine all order IDs
            notes: {
                orderIds: orderIds.join(','),
                customerId: req.user._id.toString()
            }
        });

        // Save Razorpay order ID to all orders
        await Promise.all(orders.map(order => {
            order.paymentDetails.razorpayOrderId = razorpayOrder.id;
            return order.save();
        }));

        return res.status(200).json({
            success: true,
            message: "Payment initialized",
            data: {
                key: process.env.RAZORPAY_KEY_ID,
                amount: totalAmount * 100,
                currency: "INR",
                name: "Farm Fresh",
                description: `Payment for orders: ${orderIds.join(', ')}`,
                order_id: razorpayOrder.id,
                prefill: {
                    name: req.user.username,
                    email: req.user.email,
                    contact: orders[0].shippingAddress.phone
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error initializing payment"
        });
    }
};

// Verify payment
export const verifyPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature 
        } = req.body;

        // Find all orders with this Razorpay order ID
        const orders = await Order.find({
            "paymentDetails.razorpayOrderId": razorpay_order_id
        });

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: "Orders not found"
            });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            await Promise.all(orders.map(order => {
                order.paymentStatus = "failed";
                return order.save();
            }));
            
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Update all orders
        await Promise.all(orders.map(order => {
            order.paymentStatus = "completed";
            order.status = "confirmed";
            order.paymentDetails = {
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paidAt: new Date() // Set the date of payment
            };
            return order.save();
        }));

        // Invoke the distributePayments function
        await distributePayments(orders);

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            orders
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error verifying payment"
        });
    }
};

// Function to distribute payments to farmers
const distributePayments = async (orders) => {
    for (const order of orders) {
        const items = order.items; // Assuming order.items contains farmerId and amount details

        for (const item of items) {
            const farmerId = item.farmerId;
            const amountToPay = item.amount; // Amount in paise

            // Retrieve farmer's bank details from your database
            const farmer = await User.findById(farmerId);

            // Initiate payout to the farmer
            const payoutOptions = {
                amount: amountToPay, // Amount in paise
                currency: 'INR',
                mode: 'transfer',
                recipient: {
                    bank_account: {
                        account_number: farmer.bankAccountNumber, // Farmer's bank account number
                        ifsc: farmer.ifscCode, // Farmer's IFSC code
                        account_holder_name: farmer.bankAccountHolderName // Farmer's name
                    }
                }
            };

            try {
                const payout = await razorpay.payouts.create(payoutOptions);
                console.log(`Payout successful for farmer ${farmerId}:`, payout);
            } catch (error) {
                console.error(`Error processing payout for farmer ${farmerId}:`, error);
                // Handle payout failure (e.g., log it, notify someone, etc.)
            }
        }
    }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check authorization
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        return res.status(200).json({
            success: true,
            paymentDetails: order.paymentDetails,
            paymentStatus: order.paymentStatus
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error fetching payment details"
        });
    }
};