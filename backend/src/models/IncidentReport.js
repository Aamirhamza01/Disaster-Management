/**
 * IncidentReport Schema
 *
 * Captures crowdsourced citizen incident reports during disaster events:
 *   - Ground-truth field observations (flooding, trapped civilians, fire, etc.)
 *   - Coordinates, severity, casualties/people affected
 *   - Human review pipeline: NEW -> UNDER_REVIEW -> VERIFIED -> ASSIGNED -> RESOLVED (or REJECTED)
 *   - Can be linked to an active DisasterEvent and escalated to a ResponseTask
 */

const mongoose = require('mongoose');

const INCIDENT_TYPES = [
  'Flood',
  'FlashFlood',
  'Fire',
  'Landslide',
  'StructureCollapse',
  'MedicalEmergency',
  'RoadBlockage',
  'Waterlogging',
  'Other',
];

const INCIDENT_STATUSES = [
  'NEW',
  'UNDER_REVIEW',
  'VERIFIED',
  'ASSIGNED',
  'RESOLVED',
  'REJECTED',
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const incidentReportSchema = new mongoose.Schema(
  {
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    citizenName: {
      type: String,
      trim: true,
      default: 'Anonymous Citizen',
      maxlength: 100,
    },

    citizenPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    incidentType: {
      type: String,
      required: [true, 'incidentType is required'],
      enum: INCIDENT_TYPES,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
      maxlength: 2000,
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

    district: {
      type: String,
      required: [true, 'district is required'],
      trim: true,
      index: true,
    },

    state: {
      type: String,
      required: [true, 'state is required'],
      trim: true,
      default: 'Uttarakhand',
      index: true,
    },

    severity: {
      type: String,
      required: [true, 'severity is required'],
      enum: SEVERITY_LEVELS,
      default: 'Medium',
      index: true,
    },

    peopleAffected: {
      type: Number,
      default: 0,
      min: [0, 'peopleAffected cannot be negative'],
    },

    imageUrl: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: INCIDENT_STATUSES,
      default: 'NEW',
      index: true,
    },

    disasterEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisasterEvent',
      default: null,
      index: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    associatedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResponseTask',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

incidentReportSchema.index({ location: '2dsphere' });
incidentReportSchema.index({ district: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
module.exports.INCIDENT_TYPES = INCIDENT_TYPES;
module.exports.INCIDENT_STATUSES = INCIDENT_STATUSES;
module.exports.SEVERITY_LEVELS = SEVERITY_LEVELS;