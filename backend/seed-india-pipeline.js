/**
 * Seed Script: India Pipeline & Environmental Telemetry
 *
 * Populates:
 *   1. 30 days of environmental time-series (rainfall, river level, temp) for UP districts
 *   2. Active official agency warnings (IMD & CWC)
 *   3. AI-detected anomaly alerts with natural-language explainability
 *   4. Citizen check-in reports ("Safe" and "Need Help")
 *
 * Usage:
 *   node seed-india-pipeline.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const HazardReading = require('./src/models/HazardReading');
const OfficialWarning = require('./src/models/OfficialWarning');
const AiAlert = require('./src/models/AiAlert');
const CitizenCheckIn = require('./src/models/CitizenCheckIn');
const User = require('./src/models/User');
const AdminUser = require('./src/models/AdminUser');
const DisasterEvent = require('./src/models/DisasterEvent');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/disaster_db';

const DISTRICTS_METADATA = [
  {
    district: 'Haridwar',
    state: 'Uttarakhand',
    coords: [78.0322, 29.9457],
    river: 'Ganga',
    warningLevel: 70.26,
    dangerLevel: 71.26,
    baselineRain: 12.5,
    baselineRiver: 68.5,
    baselineTemp: 32.0,
  },
  {
    district: 'Dehradun',
    state: 'Uttarakhand',
    coords: [78.0322, 30.3165],
    river: 'Song',
    warningLevel: 73.98,
    dangerLevel: 74.98,
    baselineRain: 18.0,
    baselineRiver: 72.8,
    baselineTemp: 31.0,
  },
  {
    district: 'Nainital',
    state: 'Uttarakhand',
    coords: [79.4464, 29.3919],
    river: 'Kosi',
    warningLevel: 83.73,
    dangerLevel: 84.73,
    baselineRain: 14.0,
    baselineRiver: 81.2,
    baselineTemp: 25.5,
  },
  {
    district: 'Udham Singh Nagar',
    state: 'Uttarakhand',
    coords: [79.5220, 28.9845],
    river: 'Kali / Kosi',
    warningLevel: 108.5,
    dangerLevel: 109.5,
    baselineRain: 10.0,
    baselineRiver: 106.2,
    baselineTemp: 32.5,
  },
];

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('[Seed] Connected successfully.');

  // Find or create super_admin
  let admin = await AdminUser.findOne({ role: 'super_admin' });
  if (!admin) {
    admin = await AdminUser.create({
      name: 'SDMA Chief Officer',
      email: 'chief@sdma.uk.gov.in',
      passwordHash: 'Disaster@12345',
      role: 'super_admin',
      assignedState: 'Uttarakhand',
      isVerified: true,
      isActive: true,
    });
  }

  // Find or create sample citizen users
  let testUser = await User.findOne({ phone: '+919876543210' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Rajesh Sharma',
      phone: '+919876543210',
      preferredLanguage: 'hi',
      lastKnownLocation: {
        type: 'Point',
        coordinates: [82.9739, 25.3176],
      },
    });
  }

  let testUser2 = await User.findOne({ phone: '+919876543211' });
  if (!testUser2) {
    testUser2 = await User.create({
      name: 'Priya Verma',
      phone: '+919876543211',
      preferredLanguage: 'en',
      lastKnownLocation: {
        type: 'Point',
        coordinates: [82.9850, 25.3250],
      },
    });
  }

  console.log('[Seed] Generating 30 days of environmental telemetry...');
  await HazardReading.deleteMany({ source: 'SIMULATED' });

  const readings = [];
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (const meta of DISTRICTS_METADATA) {
    // Generate 30 daily data points
    for (let day = 30; day >= 0; day--) {
      const timestamp = new Date(now - day * DAY_MS);
      const isSpike = day <= 2 && (meta.district === 'Varanasi' || meta.district === 'Gorakhpur');

      // 1. Rainfall
      const rainVal = isSpike
        ? +(meta.baselineRain * 4.5 + Math.random() * 20).toFixed(1) // Spike: 70 - 110mm
        : +(meta.baselineRain + (Math.random() * 8 - 4)).toFixed(1);

      readings.push({
        timestamp,
        state: meta.state,
        district: meta.district,
        stationId: `${meta.district.toUpperCase()}_AWS_01`,
        stationName: `${meta.district} Automatic Weather Station`,
        location: { type: 'Point', coordinates: meta.coords },
        indicator: 'rainfall_mm',
        value: Math.max(0, rainVal),
        unit: 'mm',
        source: 'SIMULATED',
        isAnomaly: isSpike,
        anomalyScore: isSpike ? 0.88 : 0.05,
      });

      // 2. River Level
      const riverVal = isSpike
        ? +(meta.baselineRiver + (meta.dangerLevel - meta.baselineRiver) * 0.95 + Math.random() * 0.4).toFixed(2)
        : +(meta.baselineRiver + (Math.random() * 0.6 - 0.3)).toFixed(2);

      readings.push({
        timestamp,
        state: meta.state,
        district: meta.district,
        stationId: `${meta.district.toUpperCase()}_GAUGE_01`,
        stationName: `${meta.river} River Gauge (${meta.district})`,
        location: { type: 'Point', coordinates: meta.coords },
        indicator: 'river_level_m',
        value: riverVal,
        unit: 'm',
        warningLevel: meta.warningLevel,
        dangerLevel: meta.dangerLevel,
        source: 'SIMULATED',
        isAnomaly: isSpike && riverVal >= meta.warningLevel,
        anomalyScore: isSpike ? 0.92 : 0.08,
      });

      // 3. Temperature
      const tempVal = +(meta.baselineTemp + (Math.random() * 4 - 2)).toFixed(1);
      readings.push({
        timestamp,
        state: meta.state,
        district: meta.district,
        stationId: `${meta.district.toUpperCase()}_TEMP_01`,
        stationName: `${meta.district} Observatory`,
        location: { type: 'Point', coordinates: meta.coords },
        indicator: 'temperature_c',
        value: tempVal,
        unit: '°C',
        source: 'SIMULATED',
        isAnomaly: false,
        anomalyScore: 0.1,
      });
    }
  }

  await HazardReading.insertMany(readings);
  console.log(`[Seed] Ingested ${readings.length} time-series readings.`);

  // Seed Official Warnings
  console.log('[Seed] Seeding Official Agency Warnings (IMD / CWC)...');
  await OfficialWarning.deleteMany({ source: { $in: ['IMD', 'CWC'] } });

await OfficialWarning.create([
  {
    source: 'IMD',
    hazardType: 'HeavyRainfall',
    state: 'Uttarakhand',
    district: 'Haridwar',
    severity: 'Warning',
    headline: 'IMD Orange Bulletin: Heavy to Very Heavy Rainfall in Haridwar & Uttarakhand',
    description: 'Active monsoon conditions and low pressure activity are likely to cause localized waterlogging, flash flooding, and rapid Ganga river level rises over the next 48 hours.',
    recommendedAction: 'Avoid low-lying riverbank areas and ghats, and ensure storm drainage is clear.',
    issuedAt: new Date(now - 3 * 3600 * 1000),
    validTo: new Date(now + 48 * 3600 * 1000),
    isActive: true,
  },

  {
    source: 'CWC',
    hazardType: 'Flood',
    state: 'Uttarakhand',
    district: 'Dehradun',
    severity: 'Warning',
    headline: 'CWC Hydrological Warning: River Levels Rising in Dehradun',
    description: 'Water levels in rivers and streams around Dehradun are rising due to heavy rainfall in the upper catchment areas.',
    recommendedAction: 'Alert embankment patrollers and prepare flood relief shelters in vulnerable low-lying areas.',
    issuedAt: new Date(now - 2 * 3600 * 1000),
    validTo: new Date(now + 24 * 3600 * 1000),
    isActive: true,
  },
]);

// Seed AI Alerts
console.log('[Seed] Seeding AI Anomaly Alerts...');
await AiAlert.deleteMany({});

await AiAlert.create([
  {
    state: 'Uttarakhand',
    district: 'Haridwar',
    hazardType: 'Flood',
    score: 0.89,
    threshold: 0.65,
    recommendedSeverity: 'Warning',
    suggestedCentre: [78.0322, 29.9457],
    suggestedRadiusKm: 18,
    status: 'pending_review',

    anomalyFeatures: [
      {
        indicator: 'rainfall_mm',
        currentValue: 98.4,
        baselineMean: 12.5,
        baselineStd: 14.2,
        deviationScore: 6.05,
        unit: 'mm',
      },
      {
        indicator: 'river_level_m',
        currentValue: 71.12,
        baselineMean: 68.5,
        baselineStd: 0.8,
        deviationScore: 3.27,
        unit: 'm',
      },
    ],

    explanation:
      'Multivariate anomaly score 0.89: 24h rainfall (98.4 mm) is 6.05σ above seasonal baseline. Ganga water level (71.12 m) is 0.86m above warning mark (70.26 m) and approaching danger mark (71.26 m).',

    suggestedActions: [
      'Issue immediate evacuation advisory for riverbank settlements and low-lying areas',
      'Mobilize SDRF rescue teams and boats in vulnerable Ganga riverbank areas',
      'Alert district hospitals and establish emergency water purification camps',
    ],
  },

  {
    state: 'Uttarakhand',
    district: 'Dehradun',
    hazardType: 'FlashFlood',
    score: 0.78,
    threshold: 0.65,
    recommendedSeverity: 'Watch',
    suggestedCentre: [78.0322, 30.3165],
    suggestedRadiusKm: 15,
    status: 'pending_review',

    anomalyFeatures: [
      {
        indicator: 'rainfall_mm',
        currentValue: 74.2,
        baselineMean: 18.0,
        baselineStd: 12.0,
        deviationScore: 4.68,
        unit: 'mm',
      },
      {
        indicator: 'river_level_m',
        currentValue: 74.35,
        baselineMean: 72.8,
        baselineStd: 0.5,
        deviationScore: 3.10,
        unit: 'm',
      },
    ],

    explanation:
      'Multivariate anomaly score 0.78: River and stream telemetry indicates sudden discharge influx following heavy rainfall in the upper catchment. Water levels are rising rapidly and crossing the warning threshold.',

    suggestedActions: [
      'Inspect vulnerable bridges, embankments, and river crossings',
      'Prepare community shelters in high-elevation schools and public buildings',
    ],
  },
]);

// Seed Citizen Check-ins
console.log('[Seed] Seeding Citizen Check-in Reports...');

await CitizenCheckIn.deleteMany({});

await CitizenCheckIn.create([
  {
    userId: testUser._id,
    phone: testUser.phone,
    citizenName: 'Rajesh Sharma',
    status: 'safe',
    location: {
      type: 'Point',
      coordinates: [78.0322, 29.9457],
    },
    district: 'Haridwar',
    state: 'Uttarakhand',
    message:
      'Family is currently safe on the upper floor. Water level is rising in the nearby low-lying area.',
    peopleCount: 4,
  },

  {
    userId: testUser2._id,
    phone: testUser2.phone,
    citizenName: 'Priya Verma',
    status: 'need_help',
    location: {
      type: 'Point',
      coordinates: [78.0476, 29.9560],
    },
    district: 'Haridwar',
    state: 'Uttarakhand',
    message:
      'Elderly grandparents are stranded on the ground floor near the riverbank. Need rescue assistance.',
    peopleCount: 3,
    isAcknowledgedByResponders: false,
  },
]);

console.log('[Seed] Seed script completed successfully!');

await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});