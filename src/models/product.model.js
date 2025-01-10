const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gram', 'piece', 'dozen', 'liter', 'quintal']
  },
  images: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  }
}, {timestamps: true});

productSchema.pre('save', function(next) {
  this.isOutOfStock = this.stock === 0;
  next();
});

export const Product = mongoose.model('Product', productSchema);

