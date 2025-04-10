const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['infrastructure', 'cleanliness', 'human']
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Waiting for verification', 'Verified', 'In progress', 'Solved'],
    default: 'Waiting for verification'
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  images: [String],
  category: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index
ReportSchema.index({ location: '2dsphere' });

// Update the updatedAt field before saving
ReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', ReportSchema); 