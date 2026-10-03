/**
 * EmergencyResource Schema
 *
 * Tracks disaster relief inventory, ambulances, rescue boats, kits, and supplies:
 *   - Total vs Available quantity tracking
 *   - Allocation and release mechanisms
 *   - Status: AVAILABLE, LOW_STOCK, ALLOCATED, OUT_OF_SERVICE
 */

const mongoose = require('mongoose');

const RESOURCE_TYPES = [
  'Ambulance',
  'Rescue Vehicle',
  'Medical Kit',
  'Food Pack',
  'Water',
  'Rescue Equipment',
  'Temporary Shelter Kit',
  'Other',
];

const RESOURCE_STATUSES = [
  'AVAILABLE',
  'LOW_STOCK',
  'ALLOCATED',
  'OUT_OF_SERVICE',
];

const emergencyResourceSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      required: [true, 'resourceType is required'],
      enum: RESOURCE_TYPES,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: 150,
      index: true,
    },

    quantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },

    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
      validate: {
        validator: function (v) {
          return v <= this.quantity;
        },
        message: 'availableQuantity cannot exceed total quantity',
      },
    },

    unit: {
      type: String,
      required: [true, 'Unit of measurement is required (e.g. units, kits, boxes)'],
      trim: true,
      default: 'units',
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
        default: undefined,
      },
    },

    assignedTo: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: RESOURCE_STATUSES,
      default: 'AVAILABLE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-adjust status before saving
emergencyResourceSchema.pre('save', function (next) {
  if (this.status !== 'OUT_OF_SERVICE') {
    if (this.availableQuantity === 0) {
      this.status = 'ALLOCATED';
    } else if (this.availableQuantity <= Math.ceil(this.quantity * 0.2)) {
      this.status = 'LOW_STOCK';
    } else {
      this.status = 'AVAILABLE';
    }
  }
  next();
});

emergencyResourceSchema.index({ district: 1, resourceType: 1, status: 1 });

module.exports = mongoose.model('EmergencyResource', emergencyResourceSchema);
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
module.exports.RESOURCE_STATUSES = RESOURCE_STATUSES;