/**
 * Impact Intelligence Routes — /api/impact-intelligence
 *
 * AI-assisted disaster impact estimation for operators and admins.
 * Reads from existing platform data (DisasterEvent, AiAlert,
 * IncidentReport, HazardReading, Shelter, EmergencyResource).
 * Never modifies any records — read-only.
 */

const express = require('express');
const { param, query } = require('express-validator');
const { predictDisasterImpact } = require('../services/impactPredictionService');
const DisasterEvent = require('../models/DisasterEvent');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/impact-intelligence
// Returns aggregate impact overview for all active-district events
// OR scoped to ?district= query param
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  [
    query('district').optional().isString().trim(),
    query('eventId').optional().isMongoId().withMessage('Invalid eventId'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { district, eventId } = req.query;

      if (district || eventId) {
        // Single-district / single-event mode
        const prediction = await predictDisasterImpact(district, eventId);
        return res.json({ success: true, data: prediction });
      }

      // No filter → return overview for all districts with active events
      const activeEvents = await DisasterEvent.find({
        status: { $in: ['active', 'published'] },
      })
        .select('district state type severity')
        .limit(10)
        .lean();

      const districts = [...new Set(activeEvents.map((e) => e.district))];

      if (districts.length === 0) {
        // Fallback to default district
        const prediction = await predictDisasterImpact('Varanasi', null);
        return res.json({ success: true, data: [prediction] });
      }

      // Compute for each active district (limit 5 to avoid long response)
      const predictions = await Promise.all(
        districts.slice(0, 5).map((d) => predictDisasterImpact(d, null))
      );

      res.json({ success: true, count: predictions.length, data: predictions });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/impact-intelligence/:district
// Returns impact estimate for a specific district
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:district',
  protect,
  [
    param('district').isString().trim().withMessage('District name required'),
    query('eventId').optional().isMongoId().withMessage('Invalid eventId'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const district = req.params.district;
      const { eventId } = req.query;
      const prediction = await predictDisasterImpact(district, eventId || null);
      res.json({ success: true, data: prediction });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
