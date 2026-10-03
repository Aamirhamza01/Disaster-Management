/**
 * Emergency Resource Management Routes — /api/resources
 *
 * Tracks emergency relief inventory, rescue equipment, ambulances, and supply allocation.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const EmergencyResource = require('../models/EmergencyResource');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resources/summary — KPI Stats for Dashboard & Resources Page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', protect, async (req, res, next) => {
  try {
    const district = req.query.district;
    const filter = district ? { district: new RegExp(`^${district}$`, 'i') } : {};

    const [totalDocs, availableDocs, allocatedDocs, lowStockDocs] = await Promise.all([
      EmergencyResource.countDocuments(filter),
      EmergencyResource.countDocuments({ ...filter, status: 'AVAILABLE' }),
      EmergencyResource.countDocuments({ ...filter, status: 'ALLOCATED' }),
      EmergencyResource.countDocuments({ ...filter, status: 'LOW_STOCK' }),
    ]);

    res.json({
      success: true,
      stats: {
        total: totalDocs,
        available: availableDocs,
        allocated: allocatedDocs,
        lowStock: lowStockDocs,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resources — List and Filter Resources
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  [
    query('district').optional().isString(),
    query('resourceType').optional().isString(),
    query('status').optional().isIn(['AVAILABLE', 'LOW_STOCK', 'ALLOCATED', 'OUT_OF_SERVICE', 'ALL']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { district, resourceType, status, limit = 50 } = req.query;
      const filter = {};

      if (district) filter.district = new RegExp(`^${district}$`, 'i');
      if (resourceType) filter.resourceType = resourceType;
      if (status && status !== 'ALL') filter.status = status;

      const resources = await EmergencyResource.find(filter)
        .sort({ district: 1, resourceType: 1 })
        .limit(parseInt(limit, 10))
        .lean();

      res.json({
        success: true,
        count: resources.length,
        resources,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resources — Register New Emergency Resource
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('resourceType').notEmpty().withMessage('resourceType is required'),
    body('name').notEmpty().trim().withMessage('Resource name is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('unit').notEmpty().trim().withMessage('Unit is required'),
    body('district').notEmpty().trim().withMessage('District is required'),
    body('state').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        resourceType,
        name,
        quantity,
        availableQuantity,
        unit,
        district,
        state = 'Uttar Pradesh',
        assignedTo,
      } = req.body;

      const totalQty = parseInt(quantity, 10);
      const availQty = availableQuantity !== undefined ? parseInt(availableQuantity, 10) : totalQty;

      if (availQty > totalQty) {
        return res.status(400).json({
          success: false,
          message: 'availableQuantity cannot exceed total quantity',
        });
      }

      const resource = await EmergencyResource.create({
        resourceType,
        name,
        quantity: totalQty,
        availableQuantity: availQty,
        unit,
        district,
        state,
        assignedTo: assignedTo || null,
      });

      res.status(201).json({
        success: true,
        message: 'Emergency resource registered successfully',
        resource,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resources/:id/allocate — Allocate Resource Units
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/allocate',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid resource ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Allocation quantity must be at least 1'),
    body('assignedTo').notEmpty().withMessage('assignedTo responder/task identifier is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const resource = await EmergencyResource.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      const allocQty = parseInt(req.body.quantity, 10);
      if (allocQty > resource.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot allocate ${allocQty} ${resource.unit}. Only ${resource.availableQuantity} available.`,
        });
      }

      resource.availableQuantity -= allocQty;
      resource.assignedTo = req.body.assignedTo;
      await resource.save();

      res.json({
        success: true,
        message: `Allocated ${allocQty} ${resource.unit} to ${req.body.assignedTo}`,
        resource,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resources/:id/release — Release Allocated Units back to Inventory
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/release',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid resource ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Release quantity must be at least 1'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const resource = await EmergencyResource.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      const releaseQty = parseInt(req.body.quantity, 10);
      const newAvail = resource.availableQuantity + releaseQty;
      if (newAvail > resource.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot release ${releaseQty} units. Maximum total capacity is ${resource.quantity}.`,
        });
      }

      resource.availableQuantity = newAvail;
      await resource.save();

      res.json({
        success: true,
        message: `Released ${releaseQty} ${resource.unit} back to available inventory`,
        resource,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
