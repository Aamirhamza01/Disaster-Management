/**
 * AuditEvent Schema
 *
 * Provides end-to-end provenance and timeline tracing across the disaster lifecycle:
 *   DETECT (AI Alert) -> VERIFY (SDMA/Admin) -> PREDICT -> RESPOND (Tasks/Resources) -> RECOVER
 */

const mongoose = require('mongoose');

const AUDIT_EVENT_TYPES = [
  'AI_ALERT_CREATED',
  'AI_ALERT_REVIEWED',
  'DISASTER_EVENT_CREATED',
  'DISASTER_EVENT_APPROVED',
  'OFFICIAL_WARNING_RECEIVED',
  'CITIZEN_INCIDENT_REPORTED',
  'INCIDENT_VERIFIED',
  'RESPONSE_TASK_CREATED',
  'TASK_ASSIGNED',
  'RESOURCE_ALLOCATED',
  'TASK_COMPLETED',
  'INCIDENT_RESOLVED',
  'RECOVERY_UPDATED',
  'SIMULATION_RUN',
];

const auditEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      enum: AUDIT_EVENT_TYPES,
      index: true,
    },

    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
      maxlength: 1000,
    },

    actor: {
      type: String,
      trim: true,
      default: 'System AI Engine',
    },

    actorType: {
      type: String,
      trim: true,
      default: 'SYSTEM',
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    relatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisasterEvent',
      default: null,
      index: true,
    },

    relatedIncidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IncidentReport',
      default: null,
      index: true,
    },

    relatedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResponseTask',
      default: null,
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditEventSchema.index({ relatedEventId: 1, timestamp: -1 });
auditEventSchema.index({ relatedIncidentId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
module.exports.AUDIT_EVENT_TYPES = AUDIT_EVENT_TYPES;
