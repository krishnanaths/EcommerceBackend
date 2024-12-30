const mongoose = require('mongoose');


const ProductSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productName: { type: String, required: true },
  images: { type: [String], required: true }, 
  description: { type: String, required: true },
  quantity: { type: Number, required: true }, 
  status: {
    type: String,
    enum: ["available", "out of stock"],
    default: "available",
  },
  category: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  gender: { type: String, required: true },
  price: { type: Number, required: true }, 
  compareAtPrice: { type: Number, required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
