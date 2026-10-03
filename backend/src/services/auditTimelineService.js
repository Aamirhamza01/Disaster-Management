/**
 * auditTimelineService.js
 *
 * Synthesizes a unified chronological operational timeline for a DisasterEvent.
 * Combines data from:
 *   - DisasterEvent
 *   - AuditEvent
 *   - AiAlert
 *   - OfficialWarning
 *   - IncidentReport
 *   - ResponseTask
 *   - RecoveryRecord
 *   - AlertLog
 */

const DisasterEvent = require('../models/DisasterEvent');
const AuditEvent = require('../models/AuditEvent');
const AiAlert = require('../models/AiAlert');
const OfficialWarning = require('../models/OfficialWarning');
const IncidentReport = require('../models/IncidentReport');
const ResponseTask = require('../models/ResponseTask');
const RecoveryRecord = require('../models/RecoveryRecord');
const AlertLog = require('../models/AlertLog');

/**
 * Calculates current operational stage based on actual timeline data.
 */
function calculateOperationalStage({ event, recoveryRecords = [], responseTasks = [], incidents = [], aiAlerts = [] }) {
  // 1. RECOVERED — all recovery work complete
  const hasRecoveredRecord = recoveryRecords.some((r) => r.status === 'RECOVERED');
  if (hasRecoveredRecord) return 'RECOVERED';

  // 2. RECOVERY — long term post-disaster rehabilitation active
  const hasActiveRecovery = recoveryRecords.some((r) =>
    ['INITIAL_RESPONSE', 'STABILIZATION', 'RECOVERY_IN_PROGRESS'].includes(r.status)
  );
  if (hasActiveRecovery) return 'RECOVERY';

  // 3. RESPONSE — tasks dispatched or incidents assigned/resolved
  const hasResponseActivity =
    responseTasks.length > 0 ||
    incidents.some((i) => ['ASSIGNED', 'VERIFIED', 'RESOLVED'].includes(i.status));
  if (hasResponseActivity) return 'RESPONSE';

  // 4. VERIFICATION — event approved or alerts/incidents reviewed
  const isApproved = event.status === 'active' || event.status === 'approved' || event.status === 'resolved';
  const hasReviewedAlert = aiAlerts.some((a) => a.status === 'approved' || a.status === 'dismissed');
  const hasReviewedIncident = incidents.some((i) => i.status !== 'NEW');
  if (isApproved || hasReviewedAlert || hasReviewedIncident) return 'VERIFICATION';

  // 5. DETECTION — early warning / initial detection phase
  return 'DETECTION';
}

/**
 * Generates unified audit timeline for a given eventId.
 */
async function buildEventTimeline(eventId) {
  // 1. Verify DisasterEvent exists
  const event = await DisasterEvent.findById(eventId).lean();
  if (!event) {
    return null; // Signals 404
  }

  const timelineItems = [];

  // 2. DisasterEvent creation event
  timelineItems.push({
    eventType: 'DISASTER_EVENT_CREATED',
    description: `Disaster event "${event.title}" created for ${event.district || 'district'} (${event.severity || 'Medium'} severity)`,
    actor: event.createdBy ? 'Command Operator' : 'System',
    actorType: event.createdBy ? 'OPERATOR' : 'SYSTEM',
    timestamp: event.createdAt,
    relatedIds: { eventId: String(event._id) },
    metadata: {
      type: event.type,
      severity: event.severity,
      district: event.district,
      status: event.status,
    },
  });

  if (event.status === 'active' || event.status === 'approved') {
    timelineItems.push({
      eventType: 'DISASTER_EVENT_APPROVED',
      description: `Disaster event broadcast authorized for ${event.district}`,
      actor: 'SDMA Administrator',
      actorType: 'OPERATOR',
      timestamp: event.updatedAt || event.createdAt,
      relatedIds: { eventId: String(event._id) },
      metadata: { status: event.status },
    });
  }

  // 3. AuditEvents explicitly logged
  const auditEvents = await AuditEvent.find({ relatedEventId: eventId }).lean();
  for (const ae of auditEvents) {
    timelineItems.push({
      eventType: ae.eventType,
      description: ae.description,
      actor: ae.actor || 'System',
      actorType: ae.actorType || (ae.actor?.includes('AI') ? 'AI' : 'OPERATOR'),
      timestamp: ae.timestamp || ae.createdAt,
      relatedIds: {
        eventId: ae.relatedEventId ? String(ae.relatedEventId) : undefined,
        incidentId: ae.relatedIncidentId ? String(ae.relatedIncidentId) : undefined,
        taskId: ae.relatedTaskId ? String(ae.relatedTaskId) : undefined,
      },
      metadata: ae.metadata || {},
    });
  }

  // 4. AiAlerts matching district / event
  const aiFilter = {
    $or: [{ eventId: eventId }, { district: new RegExp(`^${event.district}$`, 'i') }],
  };
  const aiAlerts = await AiAlert.find(aiFilter).lean();
  for (const ai of aiAlerts) {
    timelineItems.push({
      eventType: 'AI_ALERT_CREATED',
      description: `AI anomaly detected: ${ai.hazardType} in ${ai.district} (Risk score: ${ai.score})`,
      actor: 'AI Early Warning Engine',
      actorType: 'AI',
      timestamp: ai.createdAt,
      relatedIds: { alertId: String(ai._id), eventId: String(event._id) },
      metadata: { score: ai.score, explanation: ai.explanation, status: ai.status },
    });

    if (ai.status && ai.status !== 'pending_review') {
      timelineItems.push({
        eventType: 'AI_ALERT_REVIEWED',
        description: `AI anomaly proposal ${ai.status.toUpperCase()} by operator`,
        actor: ai.reviewedBy ? 'Duty Officer' : 'Command Operator',
        actorType: 'OPERATOR',
        timestamp: ai.updatedAt || ai.createdAt,
        relatedIds: { alertId: String(ai._id), eventId: String(event._id) },
        metadata: { status: ai.status, reviewedAt: ai.updatedAt },
      });
    }
  }

  // 5. Official Warnings correlated to district
  const officialWarnings = await OfficialWarning.find({
    district: new RegExp(`^${event.district}$`, 'i'),
  }).lean();

  for (const ow of officialWarnings) {
    timelineItems.push({
      eventType: 'OFFICIAL_WARNING_RECEIVED',
      description: `Official ${ow.hazard || 'hazard'} warning received from ${ow.source || 'IMD/CWC'} (${ow.severity || 'Warning'})`,
      actor: ow.source || 'IMD Official Feed',
      actorType: 'OFFICIAL',
      timestamp: ow.issuedAt || ow.createdAt,
      relatedIds: { warningId: String(ow._id), eventId: String(event._id) },
      metadata: { severity: ow.severity, hazard: ow.hazard, source: ow.source },
    });
  }

  // 6. Citizen Incident Reports correlated to district or eventId
  const incidentFilter = {
    $or: [{ eventId: eventId }, { district: new RegExp(`^${event.district}$`, 'i') }],
  };
  const incidents = await IncidentReport.find(incidentFilter).lean();

  for (const inc of incidents) {
    timelineItems.push({
      eventType: 'CITIZEN_INCIDENT_REPORTED',
      description: `Citizen incident reported: ${inc.title || inc.incidentType} in ${inc.district} (${inc.severity || 'Medium'})`,
      actor: 'Citizen Reporter',
      actorType: 'CITIZEN',
      timestamp: inc.createdAt,
      relatedIds: { incidentId: String(inc._id), eventId: String(event._id) },
      metadata: {
        incidentType: inc.incidentType,
        severity: inc.severity,
        peopleAffected: inc.peopleAffected,
        status: inc.status,
      },
    });

    if (['VERIFIED', 'ASSIGNED', 'RESOLVED'].includes(inc.status)) {
      timelineItems.push({
        eventType: 'INCIDENT_VERIFIED',
        description: `Incident "${inc.title}" verified by ground operator`,
        actor: 'Response Operator',
        actorType: 'OPERATOR',
        timestamp: inc.updatedAt || inc.createdAt,
        relatedIds: { incidentId: String(inc._id), eventId: String(event._id) },
        metadata: { status: inc.status },
      });
    }

    if (inc.status === 'RESOLVED') {
      timelineItems.push({
        eventType: 'INCIDENT_RESOLVED',
        description: `Incident "${inc.title}" marked RESOLVED`,
        actor: 'Response Coordinator',
        actorType: 'OPERATOR',
        timestamp: inc.updatedAt || inc.createdAt,
        relatedIds: { incidentId: String(inc._id), eventId: String(event._id) },
        metadata: { status: 'RESOLVED' },
      });
    }
  }

  // 7. Response Tasks & Resource allocations
  const responseTasks = await ResponseTask.find({
    $or: [{ eventId: eventId }, { district: new RegExp(`^${event.district}$`, 'i') }],
  }).lean();

  for (const task of responseTasks) {
    timelineItems.push({
      eventType: 'RESPONSE_TASK_CREATED',
      description: `Response task created: "${task.title}" (${task.priority || 'Medium'} priority)`,
      actor: 'Dispatch Coordinator',
      actorType: 'OPERATOR',
      timestamp: task.createdAt,
      relatedIds: { taskId: String(task._id), eventId: String(event._id) },
      metadata: { taskType: task.taskType, priority: task.priority, status: task.status },
    });

    if (task.assignedTeam || task.status === 'IN_PROGRESS' || task.status === 'ASSIGNED') {
      timelineItems.push({
        eventType: 'TASK_ASSIGNED',
        description: `Task "${task.title}" assigned to ${task.assignedTeam || 'Response Unit'}`,
        actor: 'Dispatch Coordinator',
        actorType: 'OPERATOR',
        timestamp: task.updatedAt || task.createdAt,
        relatedIds: { taskId: String(task._id), eventId: String(event._id) },
        metadata: { assignedTeam: task.assignedTeam, status: task.status },
      });
    }

    if (task.resourcesAllocated && task.resourcesAllocated.length > 0) {
      timelineItems.push({
        eventType: 'RESOURCE_ALLOCATED',
        description: `Emergency resources deployed for task "${task.title}" (${task.resourcesAllocated.length} item types)`,
        actor: 'Logistics Manager',
        actorType: 'OPERATOR',
        timestamp: task.updatedAt || task.createdAt,
        relatedIds: { taskId: String(task._id), eventId: String(event._id) },
        metadata: { resourceCount: task.resourcesAllocated.length },
      });
    }

    if (task.status === 'COMPLETED') {
      timelineItems.push({
        eventType: 'TASK_COMPLETED',
        description: `Task "${task.title}" successfully COMPLETED`,
        actor: task.assignedTeam || 'Response Unit',
        actorType: 'OPERATOR',
        timestamp: task.updatedAt || task.createdAt,
        relatedIds: { taskId: String(task._id), eventId: String(event._id) },
        metadata: { status: 'COMPLETED' },
      });
    }
  }

  // 8. Recovery Records
  const recoveryRecords = await RecoveryRecord.find({
    $or: [{ eventId: eventId }, { district: new RegExp(`^${event.district}$`, 'i') }],
  }).lean();

  for (const rec of recoveryRecords) {
    timelineItems.push({
      eventType: 'RECOVERY_UPDATED',
      description: `Recovery progress updated for ${rec.district}: ${rec.status} (${rec.infrastructureRestoredPercent}% infrastructure restored)`,
      actor: 'Recovery Officer',
      actorType: 'OPERATOR',
      timestamp: rec.updatedAt || rec.createdAt,
      relatedIds: { recoveryId: String(rec._id), eventId: String(event._id) },
      metadata: {
        status: rec.status,
        infrastructureRestoredPercent: rec.infrastructureRestoredPercent,
        peopleAssisted: rec.peopleAssisted,
        tasksCompleted: rec.tasksCompleted,
      },
    });
  }

  // Deduplicate items with exact same eventType, timestamp, and description
  const uniqueItemsMap = new Map();
  for (const item of timelineItems) {
    const key = `${item.eventType}_${new Date(item.timestamp).getTime()}_${item.description}`;
    if (!uniqueItemsMap.has(key)) {
      uniqueItemsMap.set(key, item);
    }
  }

  const finalTimeline = Array.from(uniqueItemsMap.values());

  // Sort ascending by timestamp (oldest first, chronological progression)
  finalTimeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Compute operational stage
  const currentStage = calculateOperationalStage({
    event,
    recoveryRecords,
    responseTasks,
    incidents,
    aiAlerts,
  });

  const latestActivityTime =
    finalTimeline.length > 0 ? finalTimeline[finalTimeline.length - 1].timestamp : event.updatedAt || event.createdAt;

  return {
    eventId: String(event._id),
    eventTitle: event.title,
    district: event.district,
    currentOperationalStage: currentStage,
    totalActivities: finalTimeline.length,
    latestActivityTime,
    timeline: finalTimeline,
  };
}

module.exports = {
  buildEventTimeline,
  calculateOperationalStage,
};
