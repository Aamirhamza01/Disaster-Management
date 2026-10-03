/**
 * District Risk Score Service
 *
 * Calculates a normalized 0–100 district disaster risk score using
 * real-time local data currently available in the database:
 *   1. Active DisasterEvent records (published/active incidents)
 *   2. Pending AiAlert proposals (emerging statistical anomalies)
 *   3. Latest HazardReading telemetry (hydrological & meteorological sensors)
 *
 * Risk Level Scale:
 *   0–20   : Low
 *   21–40  : Moderate
 *   41–60  : Elevated
 *   61–80  : High
 *   81–100 : Critical
 */

const DisasterEvent = require('../models/DisasterEvent');
const AiAlert = require('../models/AiAlert');
const HazardReading = require('../models/HazardReading');

const DEFAULT_DISTRICTS = [
  { district: 'Haridwar', state: 'Uttarakhand' },
  { district: 'Dehradun', state: 'Uttarakhand' },
  { district: 'Nainital', state: 'Uttarakhand' },
  { district: 'Udham Singh Nagar', state: 'Uttarakhand' },
  { district: 'Pauri Garhwal', state: 'Uttarakhand' },
  { district: 'Tehri Garhwal', state: 'Uttarakhand' },
  { district: 'Uttarkashi', state: 'Uttarakhand' },
  { district: 'Chamoli', state: 'Uttarakhand' },
];

/**
 * Determine risk level category based on 0-100 score
 */
function getRiskLevel(score) {
  if (score <= 20) return 'Low';
  if (score <= 40) return 'Moderate';
  if (score <= 60) return 'Elevated';
  if (score <= 80) return 'High';
  return 'Critical';
}

/**
 * Calculate district risk scores across monitored districts
 * @param {string} [filterDistrict] Optional single district filter
 * @returns {Promise<Array>} List of district risk scores
 */
async function calculateDistrictRiskScores(filterDistrict) {
  // Query distinct districts present in actual records, or fallback to defaults
  let targetList = DEFAULT_DISTRICTS;
  if (filterDistrict) {
    targetList = [{ district: filterDistrict, state: 'Uttar Pradesh' }];
  }

  const results = await Promise.all(
    targetList.map(async ({ district, state }) => {
      let score = 0;
      const majorHazardsSet = new Set();
      let latestTimestamp = new Date(0);
      let isSimulated = false;
      let hasLive = false;
      let hasExternalOfficial = false;

      // 1. Evaluate Active Disaster Events for this district
      const activeEvents = await DisasterEvent.find({
        district: new RegExp(`^${district}$`, 'i'),
        status: { $in: ['active', 'published'] },
      }).lean();

      for (const ev of activeEvents) {
        if (ev.type) majorHazardsSet.add(ev.type);
        if (ev.updatedAt && new Date(ev.updatedAt) > latestTimestamp) {
          latestTimestamp = new Date(ev.updatedAt);
        }

        // Weighting based on event severity
        if (ev.severity === 'Critical') score += 40;
        else if (ev.severity === 'High') score += 30;
        else if (ev.severity === 'Medium') score += 20;
        else if (ev.severity === 'Low') score += 10;
        else score += 15; // default fallback

        if (ev.isLive) hasLive = true;
      }

      // 2. Evaluate Pending / Escalated AI Alerts
      const pendingAiAlerts = await AiAlert.find({
        district: new RegExp(`^${district}$`, 'i'),
        status: { $in: ['pending_review', 'escalated'] },
      }).lean();

      for (const alert of pendingAiAlerts) {
        if (alert.hazardType) majorHazardsSet.add(alert.hazardType);
        if (alert.createdAt && new Date(alert.createdAt) > latestTimestamp) {
          latestTimestamp = new Date(alert.createdAt);
        }

        // AI anomaly contribution: up to 35 points scaled by anomaly score (0.0 - 1.0)
        const anomalyScore = typeof alert.score === 'number' ? alert.score : 0.5;
        score += Math.round(anomalyScore * 35);

        // Severity recommendation weighting
        if (alert.recommendedSeverity === 'Warning') score += 15;
        else if (alert.recommendedSeverity === 'Advisory') score += 10;
        else if (alert.recommendedSeverity === 'Watch') score += 5;

        // Current AI pipeline produces simulated/test telemetry proposals
        isSimulated = true;
      }

      // 3. Evaluate Recent Telemetry / Hazard Readings
      const recentReadings = await HazardReading.find({
        district: new RegExp(`^${district}$`, 'i'),
      })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      for (const r of recentReadings) {
        if (r.timestamp && new Date(r.timestamp) > latestTimestamp) {
          latestTimestamp = new Date(r.timestamp);
        }

        if (r.source === 'SIMULATED' || r.source === 'TEST_SUITE') {
          isSimulated = true;
        } else if (['IMD', 'CWC', 'CPCB', 'INCOIS', 'NDMA_SACHET'].includes(r.source)) {
          hasExternalOfficial = true;
        }

        // Gauge threshold breach (e.g. CWC river level above danger)
        if (r.dangerLevel && r.value >= r.dangerLevel) {
          score += 25;
          majorHazardsSet.add('Riverine Flood');
        } else if (r.warningLevel && r.value >= r.warningLevel) {
          score += 15;
          majorHazardsSet.add('High River Gauge');
        }

        // Flagged anomaly
        if (r.isAnomaly) {
          score += 15;
          if (r.indicator === 'rainfall_mm') majorHazardsSet.add('Heavy Rain Anomaly');
          else if (r.indicator === 'river_level_m') majorHazardsSet.add('Water Surge');
          else if (r.indicator === 'temperature_c') majorHazardsSet.add('Temperature Anomaly');
        }
      }

      // Clamp overall score between 0 and 100
      const overallRiskScore = Math.min(100, Math.max(0, Math.round(score)));
      const riskLevel = getRiskLevel(overallRiskScore);

      // Determine honest data status
      let dataStatus = 'SIMULATED';
      if (hasLive) {
        dataStatus = 'LIVE';
      } else if (hasExternalOfficial) {
        dataStatus = 'EXTERNAL / OFFICIAL';
      } else if (activeEvents.length > 0 && !isSimulated) {
        dataStatus = 'MANUAL';
      }

      return {
        district,
        state,
        overallRiskScore,
        riskLevel,
        majorHazards: Array.from(majorHazardsSet),
        lastUpdated: latestTimestamp.getTime() > 0 ? latestTimestamp.toISOString() : new Date().toISOString(),
        dataStatus,
      };
    })
  );

  // Sort descending by risk score
  return results.sort((a, b) => b.overallRiskScore - a.overallRiskScore);
}

module.exports = {
  calculateDistrictRiskScores,
  getRiskLevel,
};
