/**
 * Disaster Simulation Lab Routes — /api/simulations
 *
 * Allows operators to test "what-if" disaster scenarios (e.g. 100mm flash flood in Varanasi)
 * without touching or corrupting production telemetry or live operational events.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const SimulationRun = require('../models/SimulationRun');
const AuditEvent = require('../models/AuditEvent');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/simulations — Execute Hypothetical Simulation Run
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('district').notEmpty().trim().withMessage('District is required'),
    body('hazardType').notEmpty().withMessage('Hazard type is required'),
    body('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('simulatedIntensity').isFloat({ min: 1, max: 10 }).withMessage('simulatedIntensity must be between 1 and 10'),
    body('affectedRadiusKm').isFloat({ min: 1, max: 200 }).withMessage('affectedRadiusKm must be between 1 and 200'),
    body('estimatedPopulationMultiplier').optional().isFloat({ min: 0.1, max: 10 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        district,
        state = 'Uttarakhand',
        hazardType,
        severity = 'High',
        simulatedIntensity,
        affectedRadiusKm,
        estimatedPopulationMultiplier = 1.0,
      } = req.body;

      // Deterministic simulation modeling formula
      const baseSeverityWeight =
        severity === 'Critical' ? 40 : severity === 'High' ? 30 : severity === 'Medium' ? 20 : 10;
      const intensityWeight = (simulatedIntensity / 10) * 45;
      const radiusWeight = Math.min(15, (affectedRadiusKm / 50) * 15);

      const simulatedRiskScore = Math.min(
        100,
        Math.max(10, Math.round(baseSeverityWeight + intensityWeight + radiusWeight))
      );

      let riskLevel = 'Low';
      if (simulatedRiskScore > 80) riskLevel = 'Critical';
      else if (simulatedRiskScore > 60) riskLevel = 'High';
      else if (simulatedRiskScore > 40) riskLevel = 'Elevated';
      else if (simulatedRiskScore > 20) riskLevel = 'Moderate';

      // Population estimates
      const baseAffected = Math.round(
        affectedRadiusKm * affectedRadiusKm * 18 * simulatedIntensity * estimatedPopulationMultiplier
      );
      const estimatedAffectedPeople = Math.max(100, baseAffected);
      const estimatedDisplacedPeople = Math.round(estimatedAffectedPeople * 0.4);
      const estimatedShelterDemand = Math.round(estimatedDisplacedPeople * 0.8);

      const estimatedResourceDemand = {
        ambulances: Math.max(2, Math.ceil(estimatedAffectedPeople / 250)),
        rescueVehicles: Math.max(4, Math.ceil(estimatedAffectedPeople / 150)),
        medicalKits: Math.max(15, Math.ceil(estimatedAffectedPeople / 40)),
        foodPacks: Math.max(100, Math.ceil(estimatedAffectedPeople * 2)),
      };

      const recommendedResponsePriority =
        simulatedRiskScore > 75 ? 'CRITICAL' : simulatedRiskScore > 50 ? 'HIGH' : 'MEDIUM';

      const recommendedActions = [
        `Pre-position ${estimatedResourceDemand.rescueVehicles} rescue vehicles in ${district} staging zone`,
        `Pre-allocate shelter capacity for ${estimatedShelterDemand} evacuees across regional relief schools`,
        `Alert SDRF and NDRF units for rapid deployment within ${affectedRadiusKm} km buffer`,
        `Broadcast bilingual SMS / Siren early warning in ${district} prior to threshold breach`,
      ];

      // Save simulation run to Sandbox DB
      const simulation = await SimulationRun.create({
        district,
        state,
        hazardType,
        severity,
        inputs: {
          simulatedIntensity,
          affectedRadiusKm,
          estimatedPopulationMultiplier,
        },
        outputs: {
          simulatedRiskScore,
          riskLevel,
          estimatedAffectedPeople,
          estimatedDisplacedPeople,
          estimatedShelterDemand,
          estimatedResourceDemand,
          recommendedResponsePriority,
          recommendedActions,
        },
        dataStatus: 'SIMULATED',
        createdBy: req.admin?._id || null,
      });

      // Record in audit timeline (fire-and-forget)
      AuditEvent.create({
        eventType: 'SIMULATION_RUN',
        description: `Executed simulation for ${hazardType} in ${district} (Simulated Risk: ${simulatedRiskScore}/100, Priority: ${recommendedResponsePriority})`,
        actor: req.admin?.name || 'Authorized Operator',
        metadata: { simulationId: simulation._id, simulatedRiskScore },
      }).catch(() => {});

      res.status(201).json({
        success: true,
        message: 'Simulation executed successfully in sandbox',
        simulation,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/simulations — List Recent Simulation Runs
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  [
    query('district').optional().isString(),
    query('hazardType').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { district, hazardType, limit = 20 } = req.query;
      const filter = {};

      if (district) filter.district = new RegExp(`^${district}$`, 'i');
      if (hazardType) filter.hazardType = hazardType;

      const simulations = await SimulationRun.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();

      res.json({
        success: true,
        count: simulations.length,
        simulations,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/simulations/:id — Get Specific Simulation Run Details
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid simulation ID')],
  validate,
  async (req, res, next) => {
    try {
      const simulation = await SimulationRun.findById(req.params.id).populate(
        'createdBy',
        'name email role'
      );

      if (!simulation) {
        return res.status(404).json({ success: false, message: 'Simulation run not found' });
      }

      res.json({
        success: true,
        simulation,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
