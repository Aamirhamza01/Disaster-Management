/**
 * SimulationRun Schema
 *
 * Stores hypothetical scenario simulations executed by operators:
 *   - Runs sandbox calculations without altering production hazard readings or active events
 *   - Calculates simulated risk score, estimated casualty/affected load, shelter/resource demand
 *   - Data status is strictly marked as SIMULATED
 */

const mongoose = require('mongoose');

const simulationRunSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },

    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Uttarakhand',
    },

    hazardType: {
      type: String,
      required: [true, 'Hazard type is required'],
      enum: [
        'Flood',
        'FlashFlood',
        'HeavyRainfall',
        'Earthquake',
        'Cyclone',
        'Landslide',
        'Fire',
        'Heatwave',
        'Other',
      ],
      index: true,
    },

    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High',
    },

    inputs: {
      simulatedIntensity: {
        type: Number, // 1 to 10 scale
        required: true,
        min: 1,
        max: 10,
        default: 5,
      },
      affectedRadiusKm: {
        type: Number,
        required: true,
        min: 1,
        max: 200,
        default: 15,
      },
      estimatedPopulationMultiplier: {
        type: Number,
        default: 1.0,
        min: 0.1,
        max: 10.0,
      },
      infrastructureVulnerability: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Critical'],
        default: 'Moderate',
      },
    },

    outputs: {
      simulatedRiskScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      riskLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'Elevated', 'High', 'Critical'],
      },
      estimatedAffectedPeople: Number,
      estimatedDisplacedPeople: Number,
      estimatedShelterDemand: Number,
      estimatedResourceDemand: {
        ambulances: Number,
        rescueVehicles: Number,
        medicalKits: Number,
        foodPacks: Number,
      },
      recommendedResponsePriority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      },
      recommendedActions: [String],
    },

    dataStatus: {
      type: String,
      default: 'SIMULATED',
      immutable: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

simulationRunSchema.index({ district: 1, createdAt: -1 });

module.exports = mongoose.model('SimulationRun', simulationRunSchema);