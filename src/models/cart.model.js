import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
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
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate total amount before saving
cartSchema.pre('save', async function(next) {
    let total = 0;
    if (this.items.length > 0) {
        for (let item of this.items) {
            const product = await mongoose.model('Product').findById(item.product);
            if (product) {
                total += product.price * item.quantity;
            }
        }
    }
    this.totalAmount = total;
    next();
});

export const Cart = mongoose.model('Cart', cartSchema); 