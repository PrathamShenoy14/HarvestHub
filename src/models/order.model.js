const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        phone: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'online'],
        required: true
    },
    paymentDetails: {
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        paidAt: Date
    },
    deliveryNotes: {
        type: String
    }
}, { timestamps: true });

// Add index for status-based queries
orderSchema.index({ status: 1, createdAt: -1 });

// Calculate total amount before saving
orderSchema.pre('save', function(next) {
    if (this.items && this.items.length > 0) {
        this.totalAmount = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    next();
});

// Add validation for online payments
orderSchema.pre('save', function(next) {
    if (this.paymentMethod === 'online' && this.paymentStatus === 'completed') {
        if (!this.paymentDetails.razorpayOrderId || 
            !this.paymentDetails.razorpayPaymentId || 
            !this.paymentDetails.razorpaySignature) {
            next(new Error('Payment details are required for online payment'));
        }
        this.paymentDetails.paidAt = new Date();
    }
    next();
});

export const Order = mongoose.model('Order', orderSchema);
