/**
 * Audit Timeline Routes — /api/audit-timeline
 *
 * Provides a read-only, unified chronological operational timeline for a DisasterEvent.
 */

const express = require('express');
const { param } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { buildEventTimeline } = require('../services/auditTimelineService');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/audit-timeline/:eventId — Get Unified Operational Timeline
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:eventId',
  protect,
  [param('eventId').isMongoId().withMessage('Invalid event ID')],
  validate,
  async (req, res, next) => {
    try {
      const { eventId } = req.params;

      const timelineData = await buildEventTimeline(eventId);

      if (!timelineData) {
        return res.status(404).json({
          success: false,
          message: 'Disaster event not found',
        });
      }

      res.json({
        success: true,
        data: timelineData,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
