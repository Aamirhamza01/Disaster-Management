/**
 * Shelter Schema
 *
 * Emergency relief camp and evacuation shelter tracking:
 *   - Capacity vs current occupancy
 *   - Facilities (food, medical, power, clean water, sanitation)
 *   - GeoJSON location for routing and geospatial lookups
 *   - Status: AVAILABLE, NEAR_CAPACITY, FULL, CLOSED
 */

const mongoose = require('mongoose');

const SHELTER_STATUSES = ['AVAILABLE', 'NEAR_CAPACITY', 'FULL', 'CLOSED'];

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
      maxlength: 150,
      index: true,
    },

    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: 300,
    },

    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },

    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Uttarakhand',
      index: true,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'coordinates [lng, lat] are required'],
        validate: {
          validator: (v) =>
            Array.isArray(v) &&
            v.length === 2 &&
            v[0] >= -180 &&
            v[0] <= 180 &&
            v[1] >= -90 &&
            v[1] <= 90,
          message: 'coordinates must be valid [longitude, latitude]',
        },
      },
    },

    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1 person'],
    },

    currentOccupancy: {
      type: Number,
      default: 0,
      min: [0, 'Occupancy cannot be negative'],
      validate: {
        validator: function (v) {
          return v <= this.capacity;
        },
        message: 'currentOccupancy cannot exceed shelter capacity',
      },
    },

    facilities: {
      type: [String],
      default: ['Clean Water', 'Food Supply', 'First Aid', 'Sanitation'],
    },

    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      maxlength: 25,
    },

    status: {
      type: String,
      enum: SHELTER_STATUSES,
      default: 'AVAILABLE',
      index: true,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for occupancy percentage
shelterSchema.virtual('occupancyPercentage').get(function () {
  if (!this.capacity || this.capacity === 0) return 0;
  return Math.min(100, Math.round((this.currentOccupancy / this.capacity) * 100));
});

// Middleware to automatically compute shelter status before save
shelterSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  if (this.status !== 'CLOSED') {
    if (this.currentOccupancy >= this.capacity) {
      this.status = 'FULL';
    } else if (this.currentOccupancy / this.capacity >= 0.85) {
      this.status = 'NEAR_CAPACITY';
    } else {
      this.status = 'AVAILABLE';
    }
  }
  next();
});

shelterSchema.index({ location: '2dsphere' });
shelterSchema.index({ district: 1, status: 1 });

module.exports = mongoose.model('Shelter', shelterSchema);
module.exports.SHELTER_STATUSES = SHELTER_STATUSES;