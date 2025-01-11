import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'other']
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'dozen', 'piece', 'litre', 'gram']
  },
  images: {
    type: [String],
    validate: {
      validator: function(images) {
        return images.length >= 1 && images.length <= 5;
      },
      message: 'Products must have between 1 and 5 photos'
    },
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {timestamps: true});

productSchema.pre('save', function(next) {
  this.isOutOfStock = this.stock === 0;
  next();
});

export const Product = mongoose.model('Product', productSchema);

