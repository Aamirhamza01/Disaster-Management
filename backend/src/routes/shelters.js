1/**
 * Shelter Management Routes — /api/shelters
 *
 * Tracks relief camps, evacuation facilities, occupancy, and availability across districts.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const Shelter = require('../models/Shelter');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/shelters — List Shelters (Public or Operator)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('district').optional().isString(),
    query('status').optional().isIn(['AVAILABLE', 'NEAR_CAPACITY', 'FULL', 'CLOSED', 'ALL']),
    query('availableOnly').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { district, status, availableOnly, limit = 50 } = req.query;
      const filter = {};

      if (district) filter.district = new RegExp(`^${district}$`, 'i');
      if (status && status !== 'ALL') filter.status = status;
      if (availableOnly === 'true' || availableOnly === true) {
        filter.status = { $in: ['AVAILABLE', 'NEAR_CAPACITY'] };
      }

      const shelters = await Shelter.find(filter)
        .sort({ district: 1, currentOccupancy: -1 })
        .limit(parseInt(limit, 10))
        .lean({ virtuals: true });

      // Add occupancy percentage explicitly for lean queries
      const mapped = shelters.map((s) => ({
        ...s,
        occupancyPercentage: s.capacity > 0 ? Math.min(100, Math.round((s.currentOccupancy / s.capacity) * 100)) : 0,
      }));

      res.json({
        success: true,
        count: mapped.length,
        shelters: mapped,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/shelters/:id — Get Shelter Detail
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid shelter ID')],
  validate,
  async (req, res, next) => {
    try {
      const shelter = await Shelter.findById(req.params.id);
      if (!shelter) {
        return res.status(404).json({ success: false, message: 'Shelter not found' });
      }

      res.json({
        success: true,
        shelter,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/shelters — Create New Shelter (Admin/Operator)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('name').notEmpty().trim().withMessage('Shelter name is required'),
    body('address').notEmpty().trim().withMessage('Address is required'),
    body('district').notEmpty().trim().withMessage('District is required'),
    body('state').optional().trim(),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1 person'),
    body('currentOccupancy').optional().isInt({ min: 0 }),
    body('facilities').optional().isArray(),
    body('contactNumber').notEmpty().trim().withMessage('Contact number is required'),
    body('coordinates').optional().isArray({ min: 2, max: 2 }).withMessage('coordinates must be [lng, lat]'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        name,
        address,
        district,
        state = 'Uttarakhand',
        capacity,
        currentOccupancy = 0,
        facilities,
        contactNumber,
        coordinates = [82.9739, 25.3176],
      } = req.body;

      if (currentOccupancy > capacity) {
        return res.status(400).json({
          success: false,
          message: 'currentOccupancy cannot exceed capacity',
        });
      }

      const shelter = await Shelter.create({
        name,
        address,
        district,
        state,
        capacity,
        currentOccupancy,
        facilities: facilities || ['Clean Water', 'Food Supply', 'First Aid', 'Sanitation'],
        contactNumber,
        location: {
          type: 'Point',
          coordinates,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Shelter registered successfully',
        shelter,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/shelters/:id — Update Shelter (Admin/Operator)
// ─────────────────────────────────────────────────────────────────────────────
router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid shelter ID'),
    body('capacity').optional().isInt({ min: 1 }),
    body('currentOccupancy').optional().isInt({ min: 0 }),
    body('status').optional().isIn(['AVAILABLE', 'NEAR_CAPACITY', 'FULL', 'CLOSED']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const shelter = await Shelter.findById(req.params.id);
      if (!shelter) {
        return res.status(404).json({ success: false, message: 'Shelter not found' });
      }

      const { name, address, district, capacity, currentOccupancy, facilities, contactNumber, status } = req.body;

      if (capacity !== undefined) shelter.capacity = capacity;
      if (currentOccupancy !== undefined) {
        if (currentOccupancy > shelter.capacity) {
          return res.status(400).json({
            success: false,
            message: 'currentOccupancy cannot exceed capacity',
          });
        }
        shelter.currentOccupancy = currentOccupancy;
      }

      if (name) shelter.name = name;
      if (address) shelter.address = address;
      if (district) shelter.district = district;
      if (facilities) shelter.facilities = facilities;
      if (contactNumber) shelter.contactNumber = contactNumber;
      if (status) shelter.status = status;

      await shelter.save();

      res.json({
        success: true,
        message: 'Shelter updated successfully',
        shelter,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/shelters/:id/occupancy — Update Shelter Occupancy
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id/occupancy',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid shelter ID'),
    body('currentOccupancy').isInt({ min: 0 }).withMessage('currentOccupancy must be >= 0'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const shelter = await Shelter.findById(req.params.id);
      if (!shelter) {
        return res.status(404).json({ success: false, message: 'Shelter not found' });
      }

      const newOccupancy = parseInt(req.body.currentOccupancy, 10);
      if (newOccupancy > shelter.capacity) {
        return res.status(400).json({
          success: false,
          message: `currentOccupancy (${newOccupancy}) cannot exceed shelter capacity (${shelter.capacity})`,
        });
      }

      shelter.currentOccupancy = newOccupancy;
      await shelter.save();

      res.json({
        success: true,
        message: 'Shelter occupancy updated',
        shelter,
        occupancyPercentage: shelter.occupancyPercentage,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
