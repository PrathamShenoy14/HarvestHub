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
    },
    price: {
        type: Number,
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
    },
    totalItems: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate total amount before saving
cartSchema.pre('save', async function(next) {
    try {
        // Get all products in one query instead of multiple
        const productIds = this.items.map(item => item.product);
        const products = await mongoose.model('Product')
            .find({ _id: { $in: productIds } })
            .select('price');

        // Create price lookup
        const priceMap = {};
        products.forEach(product => {
            priceMap[product._id.toString()] = product.price;
        });

        // Calculate totals
        let totalAmount = 0;
        let totalItems = 0;

        this.items.forEach(item => {
            const price = priceMap[item.product.toString()];
            if (price) {
                totalAmount += price * item.quantity;
                totalItems += item.quantity;
            }
        });

        this.totalAmount = totalAmount;
        this.totalItems = totalItems;
        
        next();
    } catch (error) {
        next(error);
    }
});

export const Cart = mongoose.model('Cart', cartSchema); 