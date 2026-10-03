/**
 * ResponseTask Schema
 *
 * Operational action item assigned to SDRF, NDRF, district teams, or medical units:
 *   - Can originate from a verified IncidentReport or a DisasterEvent
 *   - Priority levels: LOW, MEDIUM, HIGH, CRITICAL
 *   - Status: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
 *   - Tracks responder assignment, due dates, completion timestamps, and allocated resources
 */

const mongoose = require('mongoose');

const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const TASK_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const responseTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 150,
      index: true,
    },

    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      maxlength: 2000,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisasterEvent',
      default: null,
      index: true,
    },

    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IncidentReport',
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
      index: true,
    },

    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'MEDIUM',
      index: true,
    },

    assignedTo: {
      type: String,
      trim: true,
      default: 'Unassigned',
      index: true,
    },

    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'PENDING',
      index: true,
    },

    allocatedResources: [
      {
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'EmergencyResource',
        },
        resourceName: String,
        quantity: Number,
      },
    ],

    dueAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

responseTaskSchema.index({ district: 1, status: 1, priority: 1 });

module.exports = mongoose.model('ResponseTask', responseTaskSchema);
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
module.exports.TASK_STATUSES = TASK_STATUSES;