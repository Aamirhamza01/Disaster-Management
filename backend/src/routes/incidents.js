/**
 * Incident Reporting Routes — /api/incidents
 *
 * Allows citizens to submit ground-truth disaster reports and enables
 * disaster response operators to review, verify, and escalate them into response tasks.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const IncidentReport = require('../models/IncidentReport');
const ResponseTask = require('../models/ResponseTask');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/incidents — Submit Citizen Incident Report
// Public / Citizen endpoint with optional JWT authentication
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('incidentType').notEmpty().withMessage('incidentType is required'),
    body('title').notEmpty().trim().isLength({ max: 150 }).withMessage('title is required (max 150 chars)'),
    body('description').notEmpty().trim().isLength({ max: 2000 }).withMessage('description is required (max 2000 chars)'),
    body('district').notEmpty().trim().withMessage('district is required'),
    body('state').optional().trim(),
    body('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('peopleAffected').optional().isInt({ min: 0 }).withMessage('peopleAffected must be >= 0'),
    body('location').optional().custom((val) => {
      if (val && val.coordinates && Array.isArray(val.coordinates) && val.coordinates.length === 2) {
        const [lng, lat] = val.coordinates;
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) return true;
      }
      throw new Error('location.coordinates must be valid [longitude, latitude]');
    }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        incidentType,
        title,
        description,
        district,
        state = 'Uttarakhand',
        severity = 'Medium',
        peopleAffected = 0,
        imageUrl,
        disasterEventId,
        citizenName,
        citizenPhone,
        location,
      } = req.body;

      // Extract optional coordinates or use default district point
      const coordinates = location?.coordinates || [82.9739, 25.3176];

      const report = await IncidentReport.create({
        incidentType,
        title,
        description,
        district,
        state,
        severity,
        peopleAffected: parseInt(peopleAffected, 10) || 0,
        imageUrl,
        disasterEventId: disasterEventId || null,
        citizenName: citizenName || 'Anonymous Citizen',
        citizenPhone,
        location: {
          type: 'Point',
          coordinates,
        },
        status: 'NEW',
      });

      res.status(201).json({
        success: true,
        message: 'Incident report submitted successfully',
        report,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents — List & Filter Incident Reports (Admin/Operator)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  [
    query('status').optional().isIn(['NEW', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'RESOLVED', 'REJECTED', 'ALL']),
    query('district').optional().isString(),
    query('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, district, severity, limit = 50 } = req.query;
      const filter = {};

      if (status && status !== 'ALL') filter.status = status;
      if (district) filter.district = new RegExp(`^${district}$`, 'i');
      if (severity) filter.severity = severity;

      const reports = await IncidentReport.find(filter)
        .populate('disasterEventId', 'title severity status type')
        .populate('verifiedBy', 'name email role')
        .populate('associatedTaskId', 'title status priority assignedTo')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();

      res.json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents/:id — Get Incident Report Detail
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid incident ID')],
  validate,
  async (req, res, next) => {
    try {
      const report = await IncidentReport.findById(req.params.id)
        .populate('disasterEventId')
        .populate('verifiedBy', 'name email role')
        .populate('associatedTaskId');

      if (!report) {
        return res.status(404).json({ success: false, message: 'Incident report not found' });
      }

      res.json({
        success: true,
        report,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/incidents/:id/status — Verify, Reject, or Update Incident
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid incident ID'),
    body('status').isIn(['NEW', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'RESOLVED', 'REJECTED']),
    body('reviewNotes').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, reviewNotes } = req.body;
      const report = await IncidentReport.findById(req.params.id);

      if (!report) {
        return res.status(404).json({ success: false, message: 'Incident report not found' });
      }

      report.status = status;
      if (reviewNotes !== undefined) report.reviewNotes = reviewNotes;

      if (status === 'VERIFIED' || status === 'REJECTED') {
        report.verifiedBy = req.admin?._id || null;
        report.verifiedAt = new Date();
      }

      await report.save();

      res.json({
        success: true,
        message: `Incident marked as ${status}`,
        report,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/incidents/:id/create-task — Escalate Incident to Response Task
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/create-task',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid incident ID'),
    body('taskTitle').optional().isString().isLength({ max: 150 }),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('assignedTo').optional().isString(),
    body('dueHours').optional().isInt({ min: 1, max: 168 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const report = await IncidentReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Incident report not found' });
      }

      const priority = req.body.priority || (report.severity === 'Critical' ? 'CRITICAL' : report.severity === 'High' ? 'HIGH' : 'MEDIUM');
      const title = req.body.taskTitle || `[Field Response] ${report.title} (${report.incidentType})`;
      const assignedTo = req.body.assignedTo || 'District Quick Response Team';

      const dueAt = new Date(Date.now() + (req.body.dueHours || 4) * 60 * 60 * 1000);

      // Create new response task
      const task = await ResponseTask.create({
        title,
        description: `Triggered by Citizen Incident Report (${report._id}): ${report.description}. People affected: ${report.peopleAffected}`,
        incidentId: report._id,
        eventId: report.disasterEventId || null,
        district: report.district,
        state: report.state,
        priority,
        assignedTo,
        status: 'ASSIGNED',
        dueAt,
        createdBy: req.admin?._id || null,
      });

      // Update incident state to ASSIGNED
      report.status = 'ASSIGNED';
      report.associatedTaskId = task._id;
      report.verifiedBy = req.admin?._id || null;
      report.verifiedAt = new Date();
      await report.save();

      res.status(201).json({
        success: true,
        message: 'Response task created and incident assigned',
        task,
        report,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
