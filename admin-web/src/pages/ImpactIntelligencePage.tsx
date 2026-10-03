/**
 * ImpactIntelligencePage.tsx
 *
 * AI-assisted disaster impact estimation for authorized operators.
 * Read-only — synthesizes existing platform data into an impact assessment.
 */

import { useState, useCallback } from 'react';
import {
  Brain,
  AlertTriangle,
  Users,
  Home,
  Package,
  Activity,
  ChevronRight,
  Info,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

// ── API helper ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchImpact(district: string, eventId?: string): Promise<ImpactData> {
  let url = `${API_BASE}/api/impact-intelligence/${encodeURIComponent(district)}`;
  if (eventId) url += `?eventId=${eventId}`;
  const res = await fetch(url, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load impact data');
  return json.data as ImpactData;
}

async function fetchEvents(district: string): Promise<DisasterEventOption[]> {
  const res = await fetch(
    `${API_BASE}/api/events?district=${encodeURIComponent(district)}&status=active&limit=10`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  if (!res.ok) return [];
  return (json.events || []) as DisasterEventOption[];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ImpactData {
  district: string;
  state: string;
  overallImpactScore: number;
  impactLevel: string;
  infrastructureRisk: string;
  estimatedAffectedPeople: number;
  estimatedCriticalIncidents: number;
  estimatedShelterDemand: number;
  shelterCapacity: number;
  availableShelterCapacity: number;
  shelterDeficit: number;
  estimatedResourceDemand: {
    ambulances: number;
    rescueVehicles: number;
    medicalKits: number;
    foodPacks: number;
  };
  confidence: number;
  dataStatus: string;
  factors: string[];
  timestamp: string;
}

interface DisasterEventOption {
  _id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DISTRICTS = [
  'Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Udham Singh Nagar',
  'Pauri Garhwal', 'Tehri Garhwal', 'Uttarkashi', 'Chamoli', 'Rudraprayag',
  'Almora', 'Bageshwar', 'Champawat', 'Pithoragarh',
];

// ── Color helpers ─────────────────────────────────────────────────────────────
function impactColor(level: string) {
  switch (level) {
    case 'Critical': return '#ef4444';
    case 'High':     return '#f97316';
    case 'Moderate': return '#eab308';
    case 'Low':      return '#22c55e';
    default:         return '#3b82f6';
  }
}

function riskBadgeStyle(level: string): React.CSSProperties {
  const c = impactColor(level);
  return {
    display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontWeight: 700,
    fontSize: 12, color: c, background: `${c}18`, border: `1px solid ${c}44`,
  };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `${color || '#6366f1'}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || 'var(--text-primary, #f1f5f9)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ImpactIntelligencePage() {
  const [district, setDistrict] = useState('Varanasi');
  const [events, setEvents] = useState<DisasterEventOption[]>([]);
  const [eventId, setEventId] = useState('');
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async (d: string) => {
    setEventsLoading(true);
    setEventId('');
    try {
      const evs = await fetchEvents(d);
      setEvents(evs);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setImpact(null);
    setError(null);
    loadEvents(d);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setImpact(null);
    try {
      const data = await fetchImpact(district, eventId || undefined);
      setImpact(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = impact ? impactColor(impact.impactLevel) : '#6366f1';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
              Impact Intelligence
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>
              AI-assisted disaster impact estimation from platform data
            </p>
          </div>
        </div>
        {/* AI-ASSISTED badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20, padding: '4px 12px', marginTop: 6,
        }}>
          <Brain size={11} color="#818cf8" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: 1 }}>AI-ASSISTED ESTIMATE</span>
        </div>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 28,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <Info size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc', lineHeight: 1.6 }}>
          This estimate is generated from available platform data and should{' '}
          <strong>support, not replace</strong>, human operational decisions.
          No records are modified. Confidence is indicated per result.
        </p>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        {/* District selector */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={labelStyle}>Select District</label>
          <select
            value={district}
            onChange={e => handleDistrictChange(e.target.value)}
            style={selectStyle}
          >
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Event selector */}
        <div style={{ flex: '1 1 250px' }}>
          <label style={labelStyle}>
            Disaster Event (optional)
            {eventsLoading && <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 11 }}>loading…</span>}
          </label>
          <select value={eventId} onChange={e => setEventId(e.target.value)} style={selectStyle}>
            <option value="">— All active events —</option>
            {events.map(ev => (
              <option key={ev._id} value={ev._id}>
                [{ev.severity}] {ev.title.substring(0, 45)}
              </option>
            ))}
          </select>
        </div>

        {/* Analyze button */}
        <div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '11px 28px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            }}
          >
            {loading
              ? <><div style={spinnerStyle} />Analysing…</>
              : <><BarChart3 size={16} />Analyse Impact<ChevronRight size={15} /></>}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {impact && (
        <>
          {/* Score hero */}
          <div style={{
            background: 'var(--card-bg, rgba(30,41,59,0.85))',
            border: `1px solid ${scoreColor}44`,
            borderRadius: 16, padding: '28px 32px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
          }}>
            {/* Circular score */}
            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                border: `5px solid ${scoreColor}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: `${scoreColor}10`, margin: '0 auto 10px',
              }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                  {impact.overallImpactScore}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted,#94a3b8)' }}>/100</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted,#94a3b8)', textAlign: 'center' }}>Impact Score</div>
            </div>

            {/* Labels */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary,#f1f5f9)' }}>
                  {impact.district}
                </span>
                <span style={riskBadgeStyle(impact.impactLevel)}>{impact.impactLevel.toUpperCase()} IMPACT</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 1,
                  color: '#818cf8', background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '2px 10px',
                }}>AI-ASSISTED ESTIMATE</span>
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted,#94a3b8)', marginBottom: 2 }}>Infrastructure Risk</div>
                  <span style={riskBadgeStyle(impact.infrastructureRisk)}>{impact.infrastructureRisk}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted,#94a3b8)', marginBottom: 2 }}>Confidence</div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                    {Math.round(impact.confidence * 100)}%
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted,#94a3b8)', marginBottom: 2 }}>Assessed At</div>
                  <span style={{ fontSize: 13, color: 'var(--text-primary,#e2e8f0)' }}>
                    {new Date(impact.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Refresh */}
            <button type="button" onClick={handleAnalyze} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}>
              <RefreshCw size={14} />Refresh
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
            <StatCard
              icon={<Users size={15} color="#f97316" />}
              label="Est. Affected"
              value={impact.estimatedAffectedPeople.toLocaleString()}
              sub="people in district"
              color="#f97316"
            />
            <StatCard
              icon={<AlertTriangle size={15} color="#ef4444" />}
              label="Critical Incidents"
              value={impact.estimatedCriticalIncidents}
              sub="high/critical severity"
              color="#ef4444"
            />
            <StatCard
              icon={<Home size={15} color="#3b82f6" />}
              label="Shelter Demand"
              value={impact.estimatedShelterDemand.toLocaleString()}
              sub={`${impact.availableShelterCapacity} available`}
              color={impact.shelterDeficit > 0 ? '#ef4444' : '#22c55e'}
            />
            <StatCard
              icon={<Package size={15} color="#a855f7" />}
              label="Ambulances"
              value={impact.estimatedResourceDemand.ambulances}
              sub="units estimated"
              color="#a855f7"
            />
            <StatCard
              icon={<Activity size={15} color="#06b6d4" />}
              label="Rescue Vehicles"
              value={impact.estimatedResourceDemand.rescueVehicles}
              sub="units estimated"
              color="#06b6d4"
            />
            <StatCard
              icon={<Package size={15} color="#f59e0b" />}
              label="Food Packs"
              value={impact.estimatedResourceDemand.foodPacks.toLocaleString()}
              sub="packs needed"
              color="#f59e0b"
            />
          </div>

          {/* Shelter deficit callout */}
          {impact.shelterDeficit > 0 && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#fca5a5' }}>
                <strong>Shelter deficit: {impact.shelterDeficit.toLocaleString()} beds.</strong>{' '}
                Total district capacity: {impact.shelterCapacity.toLocaleString()} —
                Projected demand: {impact.estimatedShelterDemand.toLocaleString()}.
                Consider activating overflow relief schools.
              </span>
            </div>
          )}

          {/* WHY THIS SCORE section */}
          <div style={{
            background: 'var(--card-bg, rgba(30,41,59,0.85))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: 24,
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary,#f1f5f9)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={16} color="#818cf8" />
              WHY THIS SCORE?
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted,#94a3b8)' }}>
              The following factors from platform data contributed to the overall impact score of{' '}
              <strong style={{ color: scoreColor }}>{impact.overallImpactScore}/100</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {impact.factors.map((factor, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 9, padding: '10px 14px',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#818cf8',
                  }}>{i + 1}</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary,#e2e8f0)', lineHeight: 1.55 }}>
                    {factor}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Info size={14} color="#818cf8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#a5b4fc' }}>
                Confidence: <strong>{Math.round(impact.confidence * 100)}%</strong> — increases with more verified incident reports and sensor telemetry. Baseline score of 15 applies when no active events or incidents are present.
              </span>
            </div>
          </div>
        </>
      )}

      {!impact && !loading && !error && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', opacity: 0.45,
          border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14,
        }}>
          <Brain size={52} color="#6366f1" style={{ marginBottom: 14 }} />
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-muted,#94a3b8)' }}>
            Select a district and click <strong>Analyse Impact</strong> to generate an AI-assisted estimate
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6,
  color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: 0.6,
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary, #f1f5f9)', fontSize: 14,
};

const spinnerStyle: React.CSSProperties = {
  width: 15, height: 15, borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff',
  animation: 'spin 0.7s linear infinite',
};
