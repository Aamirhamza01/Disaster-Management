/**
 * RecoveryRecord Schema
 *
 * Tracks long-term post-disaster rehabilitation, infrastructure restoration,
 * relief shelter wind-down, and humanitarian assistance:
 *   - Status: INITIAL_RESPONSE -> STABILIZATION -> RECOVERY_IN_PROGRESS -> RECOVERED
 *   - Percentage validation (0 - 100) for infrastructure restoration
 */

const mongoose = require('mongoose');

const RECOVERY_STATUSES = [
  'INITIAL_RESPONSE',
  'STABILIZATION',
  'RECOVERY_IN_PROGRESS',
  'RECOVERED',
];

const recoveryRecordSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisasterEvent',
      default: null,
      index: true,
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
    },

    status: {
      type: String,
      enum: RECOVERY_STATUSES,
      default: 'INITIAL_RESPONSE',
      index: true,
    },

    affectedPeople: {
      type: Number,
      default: 0,
      min: [0, 'affectedPeople cannot be negative'],
    },

    peopleAssisted: {
      type: Number,
      default: 0,
      min: [0, 'peopleAssisted cannot be negative'],
    },

    sheltersActive: {
      type: Number,
      default: 0,
      min: [0, 'sheltersActive cannot be negative'],
    },

    sheltersClosed: {
      type: Number,
      default: 0,
      min: [0, 'sheltersClosed cannot be negative'],
    },

    tasksCompleted: {
      type: Number,
      default: 0,
      min: [0, 'tasksCompleted cannot be negative'],
    },

    resourcesDeployed: {
      type: Number,
      default: 0,
      min: [0, 'resourcesDeployed cannot be negative'],
    },

    infrastructureRestoredPercent: {
      type: Number,
      default: 0,
      min: [0, 'percentage cannot be less than 0'],
      max: [100, 'percentage cannot exceed 100'],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

recoveryRecordSchema.index({ district: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('RecoveryRecord', recoveryRecordSchema);
module.exports.RECOVERY_STATUSES = RECOVERY_STATUSES;