/**
 * Response Task Management Routes — /api/tasks
 *
 * Coordinates operational field assignments between disaster events, verified incidents,
 * rescue units (SDRF/NDRF), and allocated emergency resources.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const ResponseTask = require('../models/ResponseTask');
const EmergencyResource = require('../models/EmergencyResource');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/summary — Task Metrics for Operations Dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', protect, async (req, res, next) => {
  try {
    const district = req.query.district;
    const filter = district ? { district: new RegExp(`^${district}$`, 'i') } : {};

    const [pendingCount, inProgressCount, criticalCount, completedCount] = await Promise.all([
      ResponseTask.countDocuments({ ...filter, status: 'PENDING' }),
      ResponseTask.countDocuments({ ...filter, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } }),
      ResponseTask.countDocuments({ ...filter, priority: 'CRITICAL', status: { $ne: 'COMPLETED' } }),
      ResponseTask.countDocuments({ ...filter, status: 'COMPLETED' }),
    ]);

    res.json({
      success: true,
      stats: {
        pending: pendingCount,
        inProgress: inProgressCount,
        critical: criticalCount,
        completed: completedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks — List & Filter Tasks
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  [
    query('district').optional().isString(),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'ALL']),
    query('status').optional().isIn(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ALL']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { district, priority, status, limit = 50 } = req.query;
      const filter = {};

      if (district) filter.district = new RegExp(`^${district}$`, 'i');
      if (priority && priority !== 'ALL') filter.priority = priority;
      if (status && status !== 'ALL') filter.status = status;

      const tasks = await ResponseTask.find(filter)
        .populate('eventId', 'title severity status type')
        .populate('incidentId', 'title incidentType severity peopleAffected location')
        .sort({ priority: -1, createdAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();

      res.json({
        success: true,
        count: tasks.length,
        tasks,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/:id — Get Task Detail
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid task ID')],
  validate,
  async (req, res, next) => {
    try {
      const task = await ResponseTask.findById(req.params.id)
        .populate('eventId')
        .populate('incidentId')
        .populate('createdBy', 'name email role');

      if (!task) {
        return res.status(404).json({ success: false, message: 'Response task not found' });
      }

      res.json({
        success: true,
        task,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks — Create New Response Task
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().trim().isLength({ max: 150 }).withMessage('Task title is required'),
    body('description').notEmpty().trim().withMessage('Task description is required'),
    body('district').notEmpty().trim().withMessage('District is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('assignedTo').optional().isString(),
    body('eventId').optional().isMongoId(),
    body('incidentId').optional().isMongoId(),
    body('dueHours').optional().isInt({ min: 1, max: 720 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        district,
        state = 'Uttar Pradesh',
        priority = 'MEDIUM',
        assignedTo = 'Unassigned',
        eventId,
        incidentId,
        dueHours = 6,
      } = req.body;

      const dueAt = new Date(Date.now() + dueHours * 60 * 60 * 1000);

      const task = await ResponseTask.create({
        title,
        description,
        district,
        state,
        priority,
        assignedTo,
        status: assignedTo !== 'Unassigned' ? 'ASSIGNED' : 'PENDING',
        eventId: eventId || null,
        incidentId: incidentId || null,
        dueAt,
        createdBy: req.admin?._id || null,
      });

      res.status(201).json({
        success: true,
        message: 'Response task created successfully',
        task,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id/assign — Assign Task to Responder
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id/assign',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('assignedTo').notEmpty().trim().withMessage('assignedTo responder name or unit is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const task = await ResponseTask.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Response task not found' });
      }

      task.assignedTo = req.body.assignedTo;
      if (task.status === 'PENDING') {
        task.status = 'ASSIGNED';
      }
      await task.save();

      res.json({
        success: true,
        message: `Task assigned to ${req.body.assignedTo}`,
        task,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id/status — Update Task Status
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('status').isIn(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const task = await ResponseTask.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Response task not found' });
      }

      task.status = req.body.status;
      if (req.body.status === 'COMPLETED') {
        task.completedAt = new Date();
      }
      await task.save();

      res.json({
        success: true,
        message: `Task status updated to ${req.body.status}`,
        task,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks/:id/allocate-resource — Associate Resource to Task
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/allocate-resource',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('resourceId').isMongoId().withMessage('Invalid resource ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const task = await ResponseTask.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Response task not found' });
      }

      const resource = await EmergencyResource.findById(req.body.resourceId);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      const qty = parseInt(req.body.quantity, 10);
      if (qty > resource.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${resource.availableQuantity} ${resource.unit} available`,
        });
      }

      // Deduct from inventory
      resource.availableQuantity -= qty;
      resource.assignedTo = `Task: ${task.title}`;
      await resource.save();

      // Append to task
      task.allocatedResources.push({
        resourceId: resource._id,
        resourceName: `${resource.name} (${resource.resourceType})`,
        quantity: qty,
      });
      await task.save();

      res.json({
        success: true,
        message: `Allocated ${qty} ${resource.unit} of ${resource.name} to task`,
        task,
        resource,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
