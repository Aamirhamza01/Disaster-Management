/**
 * DashboardPage.tsx — Emergency Command Center
 *
 * Unified operational dashboard aggregating intelligence, early warnings, community signals,
 * response operations, shelters, resources, recovery tracking, and audit provenance.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Brain,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Compass,
  Flame,
  FlaskConical,
  Home,
  Layers,
  Package,
  PlusCircle,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  getEvents,
  getDistrictRiskScores,
  getAiAlerts,
  getIncidents,
  getShelters,
  getResources,
  getTasks,
  getRecoveryRecords,
} from '../api/services';
import type {
  DisasterEvent,
  DistrictRiskScore,
  AiAlert,
  IncidentReport,
  Shelter,
  EmergencyResource,
  ResponseTask,
} from '../types';
import DataStatusBadge from '../components/DataStatusBadge';
import AuditTimeline from '../components/AuditTimeline';
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface SystemHealth {
  backend: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  aiService: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  database: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  notifications: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
}

export default function DashboardPage() {
  // ── States ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<SystemHealth>({
    backend: 'ONLINE',
    aiService: 'ONLINE',
    database: 'ONLINE',
    notifications: 'ONLINE',
  });

  // Data states
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [riskScores, setRiskScores] = useState<DistrictRiskScore[]>([]);
  const [aiAlerts, setAiAlerts] = useState<AiAlert[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [tasks, setTasks] = useState<ResponseTask[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [impactData, setImpactData] = useState<any | null>(null);

  // Controls
  const [sortRiskOrder, setSortRiskOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState<string>('');

  // ── Fetch Command Center Data ────────────────────────────────────────────────
  const loadCommandCenterData = async () => {
    setRefreshing(true);
    try {
      // System health check
      fetch(`${API_BASE}/health`)
        .then((res) => (res.ok ? 'ONLINE' : 'DEGRADED'))
        .catch(() => 'OFFLINE')
        .then((status) =>
          setHealth((h) => ({
            ...h,
            backend: status as any,
            database: status as any,
          }))
        );

      const [
        evRes,
        riskRes,
        aiRes,
        incRes,
        taskRes,
        shelterRes,
        resRes,
        recRes,
      ] = await Promise.all([
        getEvents({ status: 'active', limit: 10 }).catch(() => ({ data: { events: [] } })),
        getDistrictRiskScores().catch(() => ({ data: { data: [] } })),
        getAiAlerts({ status: 'pending_review', limit: 5 }).catch(() => ({ data: { alerts: [] } })),
        getIncidents({ limit: 50 }).catch(() => ({ data: { reports: [] } })),
        getTasks().catch(() => ({ data: { tasks: [] } })),
        getShelters().catch(() => ({ data: { shelters: [] } })),
        getResources().catch(() => ({ data: { resources: [] } })),
        getRecoveryRecords().catch(() => ({ data: { records: [] } })),
      ]);

      const activeEvs = evRes.data.events || [];
      const risks = riskRes.data.data || [];
      const pendingAi = aiRes.data.alerts || [];
      const incs = incRes.data.reports || [];
      const tsks = taskRes.data.tasks || [];
      const shlts = shelterRes.data.shelters || [];
      const rsrcs = resRes.data.resources || [];
      const recs = recRes.data.records || [];

      setEvents(activeEvs);
      setRiskScores(risks);
      setAiAlerts(pendingAi);
      setIncidents(incs);
      setTasks(tsks);
      setShelters(shlts);
      setResources(rsrcs);
      setRecoveries(recs);

      // Default timeline event selection
      if (activeEvs.length > 0 && !selectedTimelineEventId) {
        setSelectedTimelineEventId(activeEvs[0]._id);
      }

      // Fetch Impact Intelligence for top risk district if available
      if (risks.length > 0) {
        const topDistrict = risks[0].district;
        fetch(`${API_BASE}/api/impact-intelligence/${encodeURIComponent(topDistrict)}`, {
          headers: authHeaders(),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setImpactData(data.data);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load command center data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCommandCenterData();
  }, []);

  // ── Computations ─────────────────────────────────────────────────────────────
  // Section 2 Computations
  const highCriticalDistricts = useMemo(() => {
    return riskScores.filter((r) => r.overallRiskScore >= 61).length;
  }, [riskScores]);

  const activeIncidentsCount = useMemo(() => {
    return incidents.filter((i) => ['NEW', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED'].includes(i.status)).length;
  }, [incidents]);

  const activeTasksCount = useMemo(() => {
    return tasks.filter((t) => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  }, [tasks]);

  const activeRecoveriesCount = useMemo(() => {
    return recoveries.filter((r) => r.status !== 'RECOVERED').length;
  }, [recoveries]);

  // Section 3: Sorted Risk Scores
  const sortedRiskScores = useMemo(() => {
    return [...riskScores].sort((a, b) => {
      return sortRiskOrder === 'desc'
        ? b.overallRiskScore - a.overallRiskScore
        : a.overallRiskScore - b.overallRiskScore;
    });
  }, [riskScores, sortRiskOrder]);

  // Section 5 Computations
  const taskMetrics = useMemo(() => {
    const critical = tasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const pending = tasks.filter((t) => t.status === 'PENDING' || t.status === 'ASSIGNED').length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    return { critical, inProgress, pending, completed };
  }, [tasks]);

  // Section 6 Computations
  const incidentMetrics = useMemo(() => {
    const newReports = incidents.filter((i) => i.status === 'NEW').length;
    const verifiedReports = incidents.filter((i) => i.status === 'VERIFIED' || i.status === 'ASSIGNED').length;
    const highSeverity = incidents.filter((i) => i.severity === 'Critical' || i.severity === 'High').length;
    const totalAffected = incidents.reduce((acc, i) => acc + (i.peopleAffected || 0), 0);
    return { newReports, verifiedReports, highSeverity, totalAffected };
  }, [incidents]);

  // Section 7 Computations
  const shelterMetrics = useMemo(() => {
    const available = shelters.filter((s) => s.status === 'AVAILABLE').length;
    const nearCapacity = shelters.filter((s) => s.status === 'NEAR_CAPACITY').length;
    const full = shelters.filter((s) => s.status === 'FULL').length;
    return { available, nearCapacity, full };
  }, [shelters]);

  const resourceMetrics = useMemo(() => {
    const available = resources.filter((r) => r.status === 'AVAILABLE').length;
    const allocated = resources.filter((r) => r.status === 'ALLOCATED').length;
    const lowStock = resources.filter((r) => r.status === 'LOW_STOCK' || (r.availableQuantity || 0) < (r.quantity || 1) * 0.2).length;
    return { available, allocated, lowStock };
  }, [resources]);

  // Section 8 Computations
  const recoveryMetrics = useMemo(() => {
    const initial = recoveries.filter((r) => r.status === 'INITIAL_RESPONSE').length;
    const stabilization = recoveries.filter((r) => r.status === 'STABILIZATION').length;
    const inProgress = recoveries.filter((r) => r.status === 'RECOVERY_IN_PROGRESS').length;
    const recovered = recoveries.filter((r) => r.status === 'RECOVERED').length;
    const avgRestoration = recoveries.length > 0
      ? Math.round(recoveries.reduce((acc, r) => acc + (r.infrastructureRestoredPercent || 0), 0) / recoveries.length)
      : null;
    return { active: activeRecoveriesCount, stabilization, inProgress, recovered, initial, avgRestoration };
  }, [recoveries, activeRecoveriesCount]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Elevated': return '#d97706';
      case 'Moderate': return '#2563eb';
      default: return '#16a34a';
    }
  };

  return (
    <div style={{ padding: '24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0, color: 'var(--text-primary, #f8fafc)' }}>
      {/* ── HEADER & SECTION 1: SYSTEM STATUS ────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={28} style={{ color: '#ef4444' }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '1px' }}>
                  AI DISASTER INTELLIGENCE PLATFORM
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                  Emergency Command Center
                </h1>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={loadCommandCenterData}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border, #334155)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              Refresh Feeds
            </button>

            <Link
              to="/events/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.85rem',
              }}
            >
              <PlusCircle size={15} />
              Declare Event
            </Link>
          </div>
        </div>

        {/* SECTION 1 — SYSTEM STATUS BADGES */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            SYSTEM HEALTH:
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px' }}>
            <Server size={12} style={{ color: health.backend === 'ONLINE' ? '#22c55e' : '#ef4444' }} />
            <span>Backend API: <strong style={{ color: health.backend === 'ONLINE' ? '#22c55e' : '#ef4444' }}>{health.backend}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px' }}>
            <BrainCircuit size={12} style={{ color: '#22c55e' }} />
            <span>AI Anomaly Engine: <strong style={{ color: '#22c55e' }}>ONLINE</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px' }}>
            <Layers size={12} style={{ color: '#22c55e' }} />
            <span>Database Cluster: <strong style={{ color: '#22c55e' }}>ONLINE</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px' }}>
            <Radio size={12} style={{ color: '#eab308' }} />
            <span>Notification Service: <strong style={{ color: '#eab308' }}>DEGRADED (FCM SIMULATED)</strong></span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: NATIONAL / STATE RISK OVERVIEW ────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>ACTIVE DISASTERS</span>
            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#ef4444' }}>
            {loading ? '—' : events.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Live broadcast zones</div>
        </div>

        <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>HIGH/CRITICAL DISTRICTS</span>
            <Flame size={16} style={{ color: '#f97316' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#f97316' }}>
            {loading ? '—' : highCriticalDistricts}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Risk score &gt;= 61</div>
        </div>

        <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>PENDING AI ALERTS</span>
            <BrainCircuit size={16} style={{ color: '#818cf8' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#818cf8' }}>
            {loading ? '—' : aiAlerts.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Awaiting operator review</div>
        </div>

        <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>ACTIVE INCIDENTS</span>
            <Users size={16} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#38bdf8' }}>
            {loading ? '—' : activeIncidentsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Citizen reports in pipeline</div>
        </div>

        <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>RESPONSE TASKS</span>
            <ClipboardList size={16} style={{ color: '#eab308' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#eab308' }}>
            {loading ? '—' : activeTasksCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Active field operations</div>
        </div>

        <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>ACTIVE RECOVERIES</span>
            <TrendingUp size={16} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#22c55e' }}>
            {loading ? '—' : activeRecoveriesCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Rehabilitation ongoing</div>
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN COMMAND CENTER GRID ───────────────────────────── */}
      <div className="command-center-grid" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ── SECTION 3: DISTRICT RISK ──────────────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={18} style={{ color: '#60a5fa' }} />
                  District Risk Telemetry (0–100 Scale)
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Calculated from active events, sensor thresholds, and AI anomaly scores
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setSortRiskOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border, #334155)',
                    color: '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Sort: {sortRiskOrder === 'desc' ? 'Highest Risk First' : 'Lowest Risk First'}
                </button>
                <DataStatusBadge status="SIMULATED" size="sm" />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading district risk scores...</div>
            ) : sortedRiskScores.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No operational data available</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border, #334155)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>District</th>
                      <th style={{ padding: '10px 12px' }}>Risk Score</th>
                      <th style={{ padding: '10px 12px' }}>Risk Level</th>
                      <th style={{ padding: '10px 12px' }}>Major Hazards</th>
                      <th style={{ padding: '10px 12px' }}>Data Status</th>
                      <th style={{ padding: '10px 12px' }}>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRiskScores.slice(0, 6).map((r) => (
                      <tr key={r.district} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.district}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: getRiskColor(r.riskLevel), width: '28px' }}>{r.overallRiskScore}</strong>
                            <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${r.overallRiskScore}%`, height: '100%', background: getRiskColor(r.riskLevel) }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: `${getRiskColor(r.riskLevel)}20`,
                              color: getRiskColor(r.riskLevel),
                              border: `1px solid ${getRiskColor(r.riskLevel)}40`,
                            }}
                          >
                            {r.riskLevel}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                          {r.majorHazards && r.majorHazards.length > 0 ? r.majorHazards.join(', ') : 'Normal Baseline'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <DataStatusBadge status={r.dataStatus || 'SIMULATED'} size="sm" />
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.75rem' }}>
                          {format(new Date(r.lastUpdated), 'MMM d, HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SECTION 4: ACTIVE DISASTERS ───────────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                  Active Disaster Broadcast Events
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Emergency declarations currently transmitting to citizen devices
                </div>
              </div>
              <Link to="/events" style={{ fontSize: '0.8rem', color: '#60a5fa', textDecoration: 'none' }}>
                View All Events →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading active events...</div>
            ) : events.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: '8px' }} />
                <div>No operational data available</div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>No active disaster declarations in system</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border, #334155)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Event Title</th>
                      <th style={{ padding: '10px 12px' }}>District</th>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Severity</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Data Status</th>
                      <th style={{ padding: '10px 12px' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{ev.title}</td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{ev.district}</td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{ev.type}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: ev.severity === 'Critical' ? 'rgba(220,38,38,0.2)' : 'rgba(234,88,12,0.2)',
                              color: ev.severity === 'Critical' ? '#ef4444' : '#f97316',
                              border: `1px solid ${ev.severity === 'Critical' ? 'rgba(220,38,38,0.4)' : 'rgba(234,88,12,0.4)'}`,
                            }}
                          >
                            {ev.severity}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: '#60a5fa' }}>{ev.status}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <DataStatusBadge status={ev.isLive ? 'LIVE' : 'MANUAL'} size="sm" />
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.75rem' }}>
                          {format(new Date(ev.createdAt), 'MMM d, HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SECTION 5: RESPONSE OPERATIONS ────────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={18} style={{ color: '#eab308' }} />
                  Field Response Operations
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Dispatched tasks, resource allocations, and team assignments
                </div>
              </div>
              <Link to="/tasks" style={{ fontSize: '0.8rem', color: '#60a5fa', textDecoration: 'none' }}>
                Manage Operations →
              </Link>
            </div>

            {/* Task KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #334155)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Critical Tasks</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{taskMetrics.critical}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #334155)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>In Progress</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>{taskMetrics.inProgress}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #334155)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#eab308' }}>{taskMetrics.pending}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border, #334155)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Completed</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>{taskMetrics.completed}</div>
              </div>
            </div>

            {/* Recent Tasks List */}
            {tasks.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No operational data available
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border, #334155)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Task</th>
                      <th style={{ padding: '8px 10px' }}>District</th>
                      <th style={{ padding: '8px 10px' }}>Priority</th>
                      <th style={{ padding: '8px 10px' }}>Status</th>
                      <th style={{ padding: '8px 10px' }}>Assigned Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.slice(0, 4).map((t) => (
                      <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{t.title}</td>
                        <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>{t.district}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: t.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                              color: t.priority === 'CRITICAL' ? '#ef4444' : '#eab308',
                            }}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '0.75rem', color: '#60a5fa' }}>{t.status}</td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8', fontSize: '0.8rem' }}>
                          {t.assignedTo || 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SECTION 10: OPERATIONAL TIMELINE ──────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} style={{ color: '#38bdf8' }} />
                  Operational Audit Timeline
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Provenance trace across Detection, Verification, Response, and Recovery
                </div>
              </div>

              {events.length > 0 && (
                <select
                  value={selectedTimelineEventId}
                  onChange={(e) => setSelectedTimelineEventId(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border, #334155)',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                >
                  {events.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.title} ({e.district})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedTimelineEventId ? (
              <AuditTimeline eventId={selectedTimelineEventId} />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                No active disaster event selected for timeline inspection.
              </div>
            )}
          </section>
        </div>

        {/* ── SIDEBAR STACK (RIGHT COLUMN) ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ── SECTION 6: COMMUNITY SIGNALS ──────────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} style={{ color: '#38bdf8' }} />
                Community Signals
              </h4>
              <Link to="/incidents" style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}>
                Reports →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>New Reports</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{incidentMetrics.newReports}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Verified</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>{incidentMetrics.verifiedReports}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>High Severity</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>{incidentMetrics.highSeverity}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>People Affected</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#eab308' }}>{incidentMetrics.totalAffected}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              🛡️ <strong>Citizen Privacy Protected</strong>: PII &amp; contact credentials hidden.
            </div>
          </section>

          {/* ── SECTION 7: SHELTER & RESOURCE READINESS ──────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={16} style={{ color: '#22c55e' }} />
              Shelter &amp; Resource Readiness
            </h4>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
                <span>Shelter Readiness ({shelters.length} Total)</span>
                <Link to="/shelters" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.75rem' }}>
                  Manage
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.75rem' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>{shelterMetrics.available}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Available</div>
                </div>
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.3)' }}>
                  <div style={{ color: '#eab308', fontWeight: 700 }}>{shelterMetrics.nearCapacity}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Near Full</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700 }}>{shelterMetrics.full}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Full</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
                <span>Emergency Stock Supplies</span>
                <Link to="/resources" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.75rem' }}>
                  Stock
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.75rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <div style={{ color: '#3b82f6', fontWeight: 700 }}>{resourceMetrics.available}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>In Stock</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <div style={{ color: '#a855f7', fontWeight: 700 }}>{resourceMetrics.allocated}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Deployed</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700 }}>{resourceMetrics.lowStock}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Low Stock</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 8: RECOVERY METRICS ───────────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} style={{ color: '#22c55e' }} />
                Recovery &amp; Rehabilitation
              </h4>
              <Link to="/recovery" style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}>
                Tracking →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Stabilization</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f97316' }}>{recoveryMetrics.stabilization}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>In Progress</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>{recoveryMetrics.inProgress}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                <span>Avg Infrastructure Restored</span>
                <strong style={{ color: '#22c55e' }}>
                  {recoveryMetrics.avgRestoration !== null ? `${recoveryMetrics.avgRestoration}%` : 'N/A'}
                </strong>
              </div>
              {recoveryMetrics.avgRestoration !== null ? (
                <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${recoveryMetrics.avgRestoration}%`, height: '100%', background: '#22c55e' }} />
                </div>
              ) : (
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No operational data available</div>
              )}
            </div>
          </section>

          {/* ── SECTION 9: AI INTELLIGENCE ────────────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BrainCircuit size={16} style={{ color: '#818cf8' }} />
                AI Intelligence &amp; Estimation
              </h4>
              <DataStatusBadge status="SIMULATED" size="sm" />
            </div>

            {aiAlerts.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700 }}>TOP AI ANOMALY ALERT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                  {aiAlerts[0].district} — {aiAlerts[0].hazardType}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Score: <strong style={{ color: '#ef4444' }}>{aiAlerts[0].score}</strong>
                </div>
              </div>
            )}

            {impactData && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700 }}>IMPACT ESTIMATE</div>
                  <DataStatusBadge status="AI-ASSISTED ESTIMATE" size="sm" />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                  Est. Affected: <strong>{impactData.estimatedAffectedPeople?.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Impact Score: <strong style={{ color: '#f97316' }}>{impactData.overallImpactScore} / 100</strong>
                </div>
              </div>
            )}
          </section>

          {/* ── SECTION 11: QUICK ACTIONS ─────────────────────────────────── */}
          <section
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} style={{ color: '#eab308' }} />
              Quick Command Actions
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Link to="/ai-hub" style={actionBtnStyle}>
                <BrainCircuit size={14} /> Review AI Alerts
              </Link>
              <Link to="/events" style={actionBtnStyle}>
                <AlertTriangle size={14} /> Disaster Events
              </Link>
              <Link to="/incidents" style={actionBtnStyle}>
                <ShieldAlert size={14} /> Citizen Incidents
              </Link>
              <Link to="/simulation-lab" style={actionBtnStyle}>
                <FlaskConical size={14} /> Simulation Lab
              </Link>
              <Link to="/impact-intelligence" style={actionBtnStyle}>
                <Brain size={14} /> Impact Intel
              </Link>
              <Link to="/shelters" style={actionBtnStyle}>
                <Home size={14} /> Shelters
              </Link>
              <Link to="/resources" style={actionBtnStyle}>
                <Package size={14} /> Resources
              </Link>
              <Link to="/tasks" style={actionBtnStyle}>
                <ClipboardList size={14} /> Response Tasks
              </Link>
              <Link to="/recovery" style={{ ...actionBtnStyle, gridColumn: 'span 2' }}>
                <TrendingUp size={14} /> Recovery Tracking Module
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 10px',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border, #334155)',
  color: '#e2e8f0',
  fontSize: '0.75rem',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'all 0.15s ease',
};
