const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'A service must belong to a category']
    },
    name: {
      type: String,
      required: [true, 'A service must have a name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'A service must have a description']
    },
    price: {
      type: Number,
      required: [true, 'A service must have a price']
    },
    duration: {
      type: Number,
      required: [true, 'A service must have a duration in minutes']
    },
    popularity: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&h=200&q=80'
    }
  },
  {
    timestamps: true
  }
);

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
