/**
 * Impact Prediction Routes — /api/impact
 *
 * Provides transparent, AI-assisted estimation of affected population,
 * shelter deficits, and critical incident surge.
 */

const express = require('express');
const { query } = require('express-validator');
const { predictDisasterImpact } = require('../services/impactPredictionService');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/impact/predict — AI-Assisted Disaster Impact Forecasting
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/predict',
  protect,
  [
    query('district').optional().isString(),
    query('eventId').optional().isMongoId(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { district, eventId } = req.query;
      const prediction = await predictDisasterImpact(district, eventId);

      res.json({
        success: true,
        data: prediction,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
