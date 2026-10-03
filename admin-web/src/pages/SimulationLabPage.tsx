/**
 * SimulationLabPage.tsx
 *
 * Disaster Simulation Lab — hypothetical scenario tool for authorized operators.
 * Runs sandbox calculations; never modifies live operational data.
 */

import { useState } from 'react';
import { FlaskConical, AlertTriangle, ChevronRight, RotateCcw, Clock } from 'lucide-react';

// ── API helper (reuses existing auth token pattern) ───────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function runSimulationAPI(payload: SimulationPayload) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}/api/simulations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Simulation failed');
  return data.simulation;
}

async function fetchRecentSimulations() {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}/api/simulations?limit=5`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load history');
  return data.simulations as SimulationRun[];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface SimulationPayload {
  district: string;
  state: string;
  hazardType: string;
  severity: string;
  simulatedIntensity: number;
  affectedRadiusKm: number;
  estimatedPopulationMultiplier: number;
}

interface SimulationOutputs {
  simulatedRiskScore: number;
  riskLevel: string;
  estimatedAffectedPeople: number;
  estimatedDisplacedPeople: number;
  estimatedShelterDemand: number;
  estimatedResourceDemand: {
    ambulances: number;
    rescueVehicles: number;
    medicalKits: number;
    foodPacks: number;
  };
  recommendedResponsePriority: string;
  recommendedActions: string[];
}

interface SimulationRun {
  _id: string;
  district: string;
  hazardType: string;
  severity: string;
  dataStatus: string;
  createdAt: string;
  outputs: SimulationOutputs;
  inputs: {
    simulatedIntensity: number;
    affectedRadiusKm: number;
    estimatedPopulationMultiplier: number;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DISTRICTS = [
  'Varanasi', 'Gorakhpur', 'Prayagraj', 'Lucknow', 'Ayodhya',
  'Kanpur', 'Mirzapur', 'Ballia', 'Dehradun', 'Haridwar',
  'Rishikesh', 'Nainital', 'Agra', 'Meerut', 'Bareilly',
];

const STATES: Record<string, string> = {
  Varanasi: 'Uttar Pradesh', Gorakhpur: 'Uttar Pradesh', Prayagraj: 'Uttar Pradesh',
  Lucknow: 'Uttar Pradesh', Ayodhya: 'Uttar Pradesh', Kanpur: 'Uttar Pradesh',
  Mirzapur: 'Uttar Pradesh', Ballia: 'Uttar Pradesh', Agra: 'Uttar Pradesh',
  Meerut: 'Uttar Pradesh', Bareilly: 'Uttar Pradesh',
  Dehradun: 'Uttarakhand', Haridwar: 'Uttarakhand', Rishikesh: 'Uttarakhand', Nainital: 'Uttarakhand',
};

const HAZARD_TYPES = ['Flood', 'FlashFlood', 'HeavyRainfall', 'Earthquake', 'Cyclone', 'Landslide', 'Fire', 'Heatwave', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// ── Risk level color helpers ──────────────────────────────────────────────────
function riskColor(level: string) {
  if (level === 'Critical') return '#ef4444';
  if (level === 'High') return '#f97316';
  if (level === 'Elevated') return '#eab308';
  if (level === 'Moderate') return '#3b82f6';
  return '#22c55e';
}

function priorityColor(p: string) {
  if (p === 'CRITICAL') return '#ef4444';
  if (p === 'HIGH') return '#f97316';
  return '#3b82f6';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SimulationLabPage() {
  // Form state
  const [district, setDistrict] = useState('Varanasi');
  const [hazardType, setHazardType] = useState('Flood');
  const [severity, setSeverity] = useState('High');
  const [intensity, setIntensity] = useState(6);
  const [radiusKm, setRadiusKm] = useState(20);
  const [popMultiplier, setPopMultiplier] = useState(1.0);

  // Result state
  const [result, setResult] = useState<SimulationRun | null>(null);
  const [history, setHistory] = useState<SimulationRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histLoaded, setHistLoaded] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const sim = await runSimulationAPI({
        district,
        state: STATES[district] || 'Uttar Pradesh',
        hazardType,
        severity,
        simulatedIntensity: intensity,
        affectedRadiusKm: radiusKm,
        estimatedPopulationMultiplier: popMultiplier,
      });
      setResult(sim);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    setHistLoading(true);
    try {
      const runs = await fetchRecentSimulations();
      setHistory(runs);
      setHistLoaded(true);
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FlaskConical size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
              Disaster Simulation Lab
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>
              Hypothetical scenario modelling for operators — sandbox only
            </p>
          </div>
        </div>

        {/* SIMULATED badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)',
          borderRadius: 20, padding: '4px 12px', marginTop: 8,
        }}>
          <FlaskConical size={12} color="#a855f7" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: 1 }}>SIMULATED</span>
        </div>
      </div>

      {/* ── Disclaimer Banner ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 28,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <AlertTriangle size={16} color="#eab308" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#eab308', lineHeight: 1.5 }}>
          <strong>Hypothetical scenario only.</strong> This tool runs sandbox estimations and{' '}
          <strong>does not modify any live disaster events, incident reports, shelter records,
          or emergency resources.</strong> All outputs are clearly marked SIMULATED.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* ── Input Form ──────────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--card-bg, rgba(30,41,59,0.8))',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderRadius: 14, padding: 24,
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
            Scenario Parameters
          </h2>

          {/* District */}
          <label style={labelStyle}>District</label>
          <select value={district} onChange={e => setDistrict(e.target.value)} style={selectStyle}>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Hazard Type */}
          <label style={labelStyle}>Hazard Type</label>
          <select value={hazardType} onChange={e => setHazardType(e.target.value)} style={selectStyle}>
            {HAZARD_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
          </select>

          {/* Severity */}
          <label style={labelStyle}>Severity</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {SEVERITIES.map(s => (
              <button key={s} type="button" onClick={() => setSeverity(s)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                borderColor: severity === s ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                background: severity === s ? 'rgba(124,58,237,0.25)' : 'transparent',
                color: severity === s ? '#a78bfa' : 'var(--text-muted, #94a3b8)',
              }}>{s}</button>
            ))}
          </div>

          {/* Simulated Intensity */}
          <label style={labelStyle}>
            Simulated Intensity: <strong style={{ color: '#a78bfa' }}>{intensity}/10</strong>
          </label>
          <input type="range" min={1} max={10} step={0.5}
            value={intensity} onChange={e => setIntensity(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: 18, accentColor: '#7c3aed' }}
          />

          {/* Affected Radius */}
          <label style={labelStyle}>
            Affected Radius: <strong style={{ color: '#a78bfa' }}>{radiusKm} km</strong>
          </label>
          <input type="range" min={1} max={200} step={1}
            value={radiusKm} onChange={e => setRadiusKm(parseInt(e.target.value))}
            style={{ width: '100%', marginBottom: 18, accentColor: '#7c3aed' }}
          />

          {/* Population Multiplier */}
          <label style={labelStyle}>
            Population Multiplier: <strong style={{ color: '#a78bfa' }}>{popMultiplier.toFixed(1)}×</strong>
          </label>
          <input type="range" min={0.1} max={5} step={0.1}
            value={popMultiplier} onChange={e => setPopMultiplier(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: 24, accentColor: '#7c3aed' }}
          />

          {/* Run button */}
          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
              background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Running Simulation…
              </>
            ) : (
              <>
                <FlaskConical size={17} />
                RUN SIMULATION
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Results Panel ────────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--card-bg, rgba(30,41,59,0.8))',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderRadius: 14, padding: 24,
          display: 'flex', flexDirection: 'column',
        }}>
          {!result && !loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.45 }}>
              <FlaskConical size={48} color="#7c3aed" />
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted, #94a3b8)', textAlign: 'center' }}>
                Configure scenario parameters and click<br /><strong>RUN SIMULATION</strong> to see results
              </p>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, border: '4px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: '#a78bfa' }}>Computing hypothetical scenario…</p>
            </div>
          )}

          {result && !loading && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
                  Simulation Results
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    color: '#a855f7', background: 'rgba(168,85,247,0.15)',
                    border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, padding: '2px 10px',
                  }}>SIMULATED</span>
                  <button type="button" onClick={handleReset} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>

              {/* Risk Score */}
              <div style={{ textAlign: 'center', marginBottom: 20, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                  fontSize: 56, fontWeight: 800, lineHeight: 1,
                  color: riskColor(result.outputs.riskLevel),
                  fontVariantNumeric: 'tabular-nums',
                }}>{result.outputs.simulatedRiskScore}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>Simulated Risk Score / 100</div>
                <div style={{
                  display: 'inline-block', marginTop: 8, padding: '4px 14px', borderRadius: 20,
                  background: `${riskColor(result.outputs.riskLevel)}22`,
                  border: `1px solid ${riskColor(result.outputs.riskLevel)}55`,
                  color: riskColor(result.outputs.riskLevel), fontWeight: 700, fontSize: 13,
                }}>{result.outputs.riskLevel.toUpperCase()} RISK</div>
              </div>

              {/* Key stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Est. Affected', value: result.outputs.estimatedAffectedPeople.toLocaleString() },
                  { label: 'Displaced', value: result.outputs.estimatedDisplacedPeople.toLocaleString() },
                  { label: 'Shelter Demand', value: result.outputs.estimatedShelterDemand.toLocaleString() },
                  { label: 'Ambulances Needed', value: result.outputs.estimatedResourceDemand.ambulances },
                  { label: 'Rescue Vehicles', value: result.outputs.estimatedResourceDemand.rescueVehicles },
                  { label: 'Food Packs', value: result.outputs.estimatedResourceDemand.foodPacks.toLocaleString() },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Response Priority */}
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                background: `${priorityColor(result.outputs.recommendedResponsePriority)}18`,
                border: `1px solid ${priorityColor(result.outputs.recommendedResponsePriority)}40`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>Response Priority</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: priorityColor(result.outputs.recommendedResponsePriority) }}>
                  {result.outputs.recommendedResponsePriority}
                </span>
              </div>

              {/* Recommended Actions */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Recommended Actions
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.outputs.recommendedActions.map((a, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-primary, #e2e8f0)', marginBottom: 6, lineHeight: 1.5 }}>{a}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Recent Simulations History ─────────────────────────────────────────── */}
      <div style={{
        marginTop: 28, background: 'var(--card-bg, rgba(30,41,59,0.8))',
        border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 14, padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#7c3aed" />
            Recent Simulation Runs
          </h2>
          {!histLoaded && (
            <button type="button" onClick={handleLoadHistory} disabled={histLoading} style={{
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {histLoading ? 'Loading…' : 'Load History'}
            </button>
          )}
        </div>

        {!histLoaded && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>Click "Load History" to view recent sandbox runs.</p>
        )}

        {histLoaded && history.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #94a3b8)' }}>No simulation runs found yet.</p>
        )}

        {histLoaded && history.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['District', 'Hazard', 'Severity', 'Risk Score', 'Priority', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((run) => (
                  <tr key={run._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={tdStyle}>{run.district}</td>
                    <td style={tdStyle}>{run.hazardType}</td>
                    <td style={tdStyle}>{run.severity}</td>
                    <td style={tdStyle}>
                      <span style={{ color: riskColor(run.outputs.riskLevel), fontWeight: 700 }}>
                        {run.outputs.simulatedRiskScore}/100
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: priorityColor(run.outputs.recommendedResponsePriority), fontWeight: 600, fontSize: 12 }}>
                        {run.outputs.recommendedResponsePriority}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#a855f7',
                        background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: 20, padding: '2px 8px',
                      }}>SIMULATED</span>
                    </td>
                    <td style={tdStyle}>{new Date(run.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Shared style helpers ──────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6,
  color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: 0.6,
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, marginBottom: 18,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary, #f1f5f9)', fontSize: 14,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: 'var(--text-primary, #e2e8f0)', verticalAlign: 'middle',
};
