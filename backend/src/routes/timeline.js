/**
 * Unified Audit Timeline Routes — /api/timeline
 *
 * Merges formal AuditEvent entries with lifecycle transitions across
 * DisasterEvent, IncidentReport, ResponseTask, and Recovery records.
 */

const express = require('express');
const { query } = require('express-validator');
const AuditEvent = require('../models/AuditEvent');
const DisasterEvent = require('../models/DisasterEvent');
const IncidentReport = require('../models/IncidentReport');
const ResponseTask = require('../models/ResponseTask');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/timeline — Fetch Unified Lifecycle Timeline
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  [
    query('eventId').optional().isMongoId(),
    query('incidentId').optional().isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 200 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { eventId, incidentId, limit = 50 } = req.query;
      const timelineEntries = [];

      // 1. Fetch Explicit Audit Events
      const auditFilter = {};
      if (eventId) auditFilter.relatedEventId = eventId;
      if (incidentId) auditFilter.relatedIncidentId = incidentId;

      const auditDocs = await AuditEvent.find(auditFilter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit, 10))
        .lean();

      auditDocs.forEach((doc) => {
        timelineEntries.push({
          id: doc._id,
          eventType: doc.eventType,
          description: doc.description,
          actor: doc.actor,
          timestamp: doc.timestamp,
          source: 'AUDIT_LOG',
          metadata: doc.metadata,
        });
      });

      // 2. Synthesize Disaster Event Milestones if eventId given
      if (eventId) {
        const ev = await DisasterEvent.findById(eventId).lean();
        if (ev) {
          timelineEntries.push({
            id: `${ev._id}_created`,
            eventType: 'DISASTER_EVENT_CREATED',
            description: `Event "${ev.title}" created with severity ${ev.severity} in ${ev.district}`,
            actor: 'System / Operator',
            timestamp: ev.createdAt,
            source: 'DISASTER_EVENT',
          });

          if (ev.approvalWorkflow?.submittedAt) {
            timelineEntries.push({
              id: `${ev._id}_submitted`,
              eventType: 'DISASTER_EVENT_SUBMITTED',
              description: `Event submitted for SDMA verification`,
              actor: 'Operator',
              timestamp: ev.approvalWorkflow.submittedAt,
              source: 'DISASTER_EVENT',
            });
          }

          if (ev.approvalWorkflow?.approvedAt) {
            timelineEntries.push({
              id: `${ev._id}_approved`,
              eventType: 'DISASTER_EVENT_APPROVED',
              description: `Event approved & broadcast broadcasted to citizens`,
              actor: 'SDMA Authority',
              timestamp: ev.approvalWorkflow.approvedAt,
              source: 'DISASTER_EVENT',
            });
          }
        }
      }

      // 3. Synthesize Incident Milestones if incidentId given
      if (incidentId) {
        const inc = await IncidentReport.findById(incidentId).lean();
        if (inc) {
          timelineEntries.push({
            id: `${inc._id}_reported`,
            eventType: 'CITIZEN_INCIDENT_REPORTED',
            description: `Ground incident reported: ${inc.title} (${inc.peopleAffected} civilians affected)`,
            actor: inc.citizenName || 'Citizen Observer',
            timestamp: inc.createdAt,
            source: 'INCIDENT_REPORT',
          });

          if (inc.verifiedAt) {
            timelineEntries.push({
              id: `${inc._id}_verified`,
              eventType: 'INCIDENT_VERIFIED',
              description: `Incident verified by response coordinator: ${inc.reviewNotes || 'Confirmed'}`,
              actor: 'Response Coordinator',
              timestamp: inc.verifiedAt,
              source: 'INCIDENT_REPORT',
            });
          }
        }
      }

      // Sort descending by timestamp
      timelineEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        count: timelineEntries.length,
        timeline: timelineEntries.slice(0, parseInt(limit, 10)),
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
