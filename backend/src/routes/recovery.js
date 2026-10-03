/**
 * Recovery Tracking Routes — /api/recovery
 *
 * Tracks disaster rehabilitation progress, people assisted, active shelters,
 * and infrastructure restoration percentages.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const RecoveryRecord = require('../models/RecoveryRecord');
const AuditEvent = require('../models/AuditEvent');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/recovery — List Recovery Records
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  [
    query('district').optional().isString(),
    query('eventId').optional().isMongoId(),
    query('status').optional().isIn(['INITIAL_RESPONSE', 'STABILIZATION', 'RECOVERY_IN_PROGRESS', 'RECOVERED', 'ALL']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { district, eventId, status, limit = 50 } = req.query;
      const filter = {};

      if (district) filter.district = new RegExp(`^${district}$`, 'i');
      if (eventId) filter.eventId = eventId;
      if (status && status !== 'ALL') filter.status = status;

      const records = await RecoveryRecord.find(filter)
        .populate('eventId', 'title severity status type')
        .populate('updatedBy', 'name email role')
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();

      res.json({
        success: true,
        count: records.length,
        records,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/recovery/:id — Get Recovery Record Detail
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid recovery ID')],
  validate,
  async (req, res, next) => {
    try {
      const record = await RecoveryRecord.findById(req.params.id)
        .populate('eventId')
        .populate('updatedBy', 'name email role');

      if (!record) {
        return res.status(404).json({ success: false, message: 'Recovery record not found' });
      }

      res.json({
        success: true,
        record,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/recovery — Create Recovery Record
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('district').notEmpty().trim().withMessage('District is required'),
    body('eventId').notEmpty().isMongoId().withMessage('eventId must be a valid DisasterEvent ID'),
    body('status').optional().isIn(['INITIAL_RESPONSE', 'STABILIZATION', 'RECOVERY_IN_PROGRESS', 'RECOVERED']),
    body('affectedPeople').optional().isInt({ min: 0 }),
    body('peopleAssisted').optional().isInt({ min: 0 }),
    body('sheltersActive').optional().isInt({ min: 0 }),
    body('sheltersClosed').optional().isInt({ min: 0 }),
    body('tasksCompleted').optional().isInt({ min: 0 }),
    body('resourcesDeployed').optional().isInt({ min: 0 }),
    body('infrastructureRestoredPercent').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const DisasterEvent = require('../models/DisasterEvent');
      const {
        district,
        state = 'Uttarakhand',
        eventId,
        status = 'INITIAL_RESPONSE',
        affectedPeople = 0,
        peopleAssisted = 0,
        sheltersActive = 0,
        sheltersClosed = 0,
        tasksCompleted = 0,
        resourcesDeployed = 0,
        infrastructureRestoredPercent = 0,
        notes,
      } = req.body;

      if (peopleAssisted > affectedPeople) {
        return res.status(400).json({
          success: false,
          message: 'peopleAssisted cannot exceed affectedPeople',
        });
      }

      if (eventId) {
        const existingEvent = await DisasterEvent.findById(eventId);
        if (!existingEvent) {
          return res.status(400).json({
            success: false,
            message: 'Invalid eventId: DisasterEvent does not exist',
          });
        }
      }

      const record = await RecoveryRecord.create({
        district,
        state,
        eventId: eventId || null,
        status,
        affectedPeople,
        peopleAssisted,
        sheltersActive,
        sheltersClosed,
        tasksCompleted,
        resourcesDeployed,
        infrastructureRestoredPercent,
        notes,
        updatedBy: req.admin?._id || null,
      });

      // Audit timeline entry
      await AuditEvent.create({
        eventType: 'RECOVERY_UPDATED',
        description: `Initiated recovery tracking for ${district} (${status}, ${infrastructureRestoredPercent}% restored)`,
        actor: req.admin?.name || 'Recovery Coordinator',
        relatedEventId: eventId || null,
        metadata: { recoveryId: record._id },
      }).catch(() => {});

      res.status(201).json({
        success: true,
        message: 'Recovery tracking initialized',
        record,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/recovery/:id — Update Recovery Status and Restored Percent
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid recovery ID'),
    body('status').optional().isIn(['INITIAL_RESPONSE', 'STABILIZATION', 'RECOVERY_IN_PROGRESS', 'RECOVERED']),
    body('affectedPeople').optional().isInt({ min: 0 }),
    body('peopleAssisted').optional().isInt({ min: 0 }),
    body('sheltersActive').optional().isInt({ min: 0 }),
    body('sheltersClosed').optional().isInt({ min: 0 }),
    body('tasksCompleted').optional().isInt({ min: 0 }),
    body('resourcesDeployed').optional().isInt({ min: 0 }),
    body('infrastructureRestoredPercent').optional().isFloat({ min: 0, max: 100 }),
    body('notes').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const record = await RecoveryRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Recovery record not found' });
      }

      const {
        status,
        affectedPeople,
        peopleAssisted,
        infrastructureRestoredPercent,
        tasksCompleted,
        resourcesDeployed,
        sheltersActive,
        sheltersClosed,
        notes,
      } = req.body;

      const newAffectedPeople = affectedPeople !== undefined ? affectedPeople : record.affectedPeople;
      const newPeopleAssisted = peopleAssisted !== undefined ? peopleAssisted : record.peopleAssisted;

      if (newPeopleAssisted > newAffectedPeople) {
        return res.status(400).json({
          success: false,
          message: 'peopleAssisted cannot exceed affectedPeople',
        });
      }

      if (status) record.status = status;
      if (affectedPeople !== undefined) record.affectedPeople = affectedPeople;
      if (peopleAssisted !== undefined) record.peopleAssisted = peopleAssisted;
      if (infrastructureRestoredPercent !== undefined) record.infrastructureRestoredPercent = infrastructureRestoredPercent;
      if (tasksCompleted !== undefined) record.tasksCompleted = tasksCompleted;
      if (resourcesDeployed !== undefined) record.resourcesDeployed = resourcesDeployed;
      if (sheltersActive !== undefined) record.sheltersActive = sheltersActive;
      if (sheltersClosed !== undefined) record.sheltersClosed = sheltersClosed;
      if (notes !== undefined) record.notes = notes;

      record.updatedBy = req.admin?._id || null;
      await record.save();

      // Log in audit timeline
      await AuditEvent.create({
        eventType: 'RECOVERY_UPDATED',
        description: `Recovery updated: ${record.status} - Infrastructure Restored: ${record.infrastructureRestoredPercent}% (${record.peopleAssisted} assisted)`,
        actor: req.admin?.name || 'Recovery Coordinator',
        relatedEventId: record.eventId || null,
        metadata: { recoveryId: record._id },
      }).catch(() => {});

      res.json({
        success: true,
        message: 'Recovery record updated successfully',
        record,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
