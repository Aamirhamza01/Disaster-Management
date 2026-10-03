/**
 * Impact Prediction Service
 *
 * Provides transparent, AI-assisted impact forecasting for disaster events and districts.
 * Synthesizes:
 *   1. Active DisasterEvent severity & spatial radius
 *   2. Emerging AiAlert proposals & anomaly scores
 *   3. Field-verified IncidentReports & casualty counts
 *   4. Current Shelter capacities vs projected evacuee volume
 *   5. Available Emergency Resources vs rescue demand
 *
 * Clearly labeled as: AI-ASSISTED ESTIMATE
 */

const DisasterEvent = require('../models/DisasterEvent');
const AiAlert = require('../models/AiAlert');
const HazardReading = require('../models/HazardReading');
const IncidentReport = require('../models/IncidentReport');
const Shelter = require('../models/Shelter');
const EmergencyResource = require('../models/EmergencyResource');

/**
 * Predict disaster impact for a given district or specific event
 * @param {string} district
 * @param {string} [eventId]
 * @returns {Promise<Object>} Impact prediction assessment
 */
async function predictDisasterImpact(district, eventId) {
  const targetDistrict = district || 'Varanasi';
  const factors = [];
  let impactScore = 15; // baseline environmental risk

  // 1. Check Active Disaster Events
  let eventFilter = { district: new RegExp(`^${targetDistrict}$`, 'i'), status: { $in: ['active', 'published'] } };
  if (eventId) {
    eventFilter = { _id: eventId };
  }
  const events = await DisasterEvent.find(eventFilter).lean();

  let maxEventSeverity = 'None';
  let eventRadius = 15;
  if (events.length > 0) {
    const primaryEvent = events[0];
    maxEventSeverity = primaryEvent.severity;
    eventRadius = primaryEvent.radiusKm || 15;

    if (primaryEvent.severity === 'Critical') {
      impactScore += 35;
      factors.push(`Active Critical disaster event broadcast (${primaryEvent.type}) with ${eventRadius} km radius (+35 pts)`);
    } else if (primaryEvent.severity === 'High') {
      impactScore += 25;
      factors.push(`Active High-severity event active in district (+25 pts)`);
    } else {
      impactScore += 15;
      factors.push(`Active event monitoring in progress (${primaryEvent.type}, +15 pts)`);
    }
  } else {
    factors.push('No active broad-scale disaster event declared in district');
  }

  // 2. Check Pending AI Alerts
  const aiAlerts = await AiAlert.find({
    district: new RegExp(`^${targetDistrict}$`, 'i'),
    status: { $in: ['pending_review', 'escalated'] },
  }).lean();

  if (aiAlerts.length > 0) {
    const topScore = Math.max(...aiAlerts.map((a) => a.score || 0.5));
    const aiPts = Math.round(topScore * 20);
    impactScore += aiPts;
    factors.push(`${aiAlerts.length} pending AI anomaly proposal(s) with peak anomaly score ${(topScore).toFixed(2)} (+${aiPts} pts)`);
  }

  // 3. Ground Truth: Citizen Incident Reports
  const verifiedIncidents = await IncidentReport.find({
    district: new RegExp(`^${targetDistrict}$`, 'i'),
    status: { $in: ['VERIFIED', 'ASSIGNED', 'UNDER_REVIEW'] },
  }).lean();

  let reportedCasualties = 0;
  let criticalIncidentCount = 0;
  verifiedIncidents.forEach((rep) => {
    reportedCasualties += rep.peopleAffected || 0;
    if (rep.severity === 'Critical' || rep.severity === 'High') {
      criticalIncidentCount += 1;
    }
  });

  if (verifiedIncidents.length > 0) {
    const incPts = Math.min(25, verifiedIncidents.length * 4);
    impactScore += incPts;
    factors.push(`${verifiedIncidents.length} ground-verified citizen incident reports with ${reportedCasualties} affected civilians (+${incPts} pts)`);
  }

  // 4. Hydrological & Weather Telemetry
  const telemetry = await HazardReading.find({
    district: new RegExp(`^${targetDistrict}$`, 'i'),
    isAnomaly: true,
  }).sort({ timestamp: -1 }).limit(5).lean();

  if (telemetry.length > 0) {
    impactScore += 10;
    factors.push(`${telemetry.length} environmental sensor indicator threshold breach(es) detected (+10 pts)`);
  }

  // 5. Shelter Pressure Analysis
  const shelters = await Shelter.find({ district: new RegExp(`^${targetDistrict}$`, 'i') }).lean();
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const currentOccupancy = shelters.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0);
  const availableShelterCapacity = Math.max(0, totalShelterCapacity - currentOccupancy);

  // Estimated population impact projection
  const basePopMultiplier = events.length > 0 ? (events[0].radiusKm || 15) * 85 : 450;
  const estimatedAffectedPeople = Math.max(reportedCasualties * 3, basePopMultiplier + reportedCasualties);
  const estimatedShelterDemand = Math.round(estimatedAffectedPeople * 0.35);

  if (estimatedShelterDemand > availableShelterCapacity) {
    impactScore += 10;
    factors.push(`Projected shelter demand (${estimatedShelterDemand}) exceeds district net available capacity (${availableShelterCapacity}, +10 pts)`);
  }

  // 6. Resource Inventory Availability
  const resources = await EmergencyResource.find({ district: new RegExp(`^${targetDistrict}$`, 'i') }).lean();
  const availableBoats = resources
    .filter((r) => r.resourceType === 'Rescue Vehicle' || r.name.toLowerCase().includes('boat'))
    .reduce((acc, r) => acc + (r.availableQuantity || 0), 0);
  const availableAmbulances = resources
    .filter((r) => r.resourceType === 'Ambulance')
    .reduce((acc, r) => acc + (r.availableQuantity || 0), 0);

  const estimatedResourceDemand = {
    ambulances: Math.max(2, Math.ceil(estimatedAffectedPeople / 150)),
    rescueVehicles: Math.max(3, Math.ceil(estimatedAffectedPeople / 100)),
    medicalKits: Math.max(10, Math.ceil(estimatedAffectedPeople / 25)),
    foodPacks: Math.max(50, Math.ceil(estimatedAffectedPeople * 1.5)),
  };

  if (availableBoats < estimatedResourceDemand.rescueVehicles || availableAmbulances < estimatedResourceDemand.ambulances) {
    factors.push(`Resource deficit detected: Local ambulance/rescue fleet below projected emergency demand`);
  }

  // Normalization
  const overallImpactScore = Math.min(100, Math.max(5, impactScore));
  let impactLevel = 'Low';
  if (overallImpactScore > 80) impactLevel = 'Critical';
  else if (overallImpactScore > 60) impactLevel = 'High';
  else if (overallImpactScore > 40) impactLevel = 'Moderate';

  let infrastructureRisk = 'Low';
  if (overallImpactScore > 75) infrastructureRisk = 'Critical';
  else if (overallImpactScore > 50) infrastructureRisk = 'High';
  else if (overallImpactScore > 30) infrastructureRisk = 'Moderate';

  return {
    district: targetDistrict,
    state: 'Uttar Pradesh',
    overallImpactScore,
    impactLevel,
    infrastructureRisk,
    estimatedAffectedPeople,
    estimatedCriticalIncidents: Math.max(criticalIncidentCount, Math.ceil(verifiedIncidents.length * 0.4)),
    estimatedShelterDemand,
    shelterCapacity: totalShelterCapacity,
    availableShelterCapacity,
    shelterDeficit: Math.max(0, estimatedShelterDemand - availableShelterCapacity),
    estimatedResourceDemand,
    confidence: Math.min(0.92, 0.65 + (verifiedIncidents.length * 0.03) + (telemetry.length * 0.02)),
    dataStatus: 'AI-ASSISTED ESTIMATE',
    factors,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  predictDisasterImpact,
};
