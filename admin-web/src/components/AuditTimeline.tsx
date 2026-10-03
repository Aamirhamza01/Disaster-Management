/**
 * AuditTimeline.tsx
 *
 * Chronological operational timeline visualizer for a Disaster Event.
 * Integrates multi-stage provenance: Detection -> Verification -> Response -> Recovery -> Recovered.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Brain,
  AlertTriangle,
  Users,
  ClipboardList,
  Package,
  TrendingUp,
  Radio,
  Clock,
  Activity,
  RefreshCw,
  Info,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface TimelineItem {
  eventType: string;
  description: string;
  actor?: string;
  actorType?: 'SYSTEM' | 'OPERATOR' | 'CITIZEN' | 'AI' | 'OFFICIAL' | string;
  timestamp: string;
  relatedIds?: {
    eventId?: string;
    incidentId?: string;
    taskId?: string;
    alertId?: string;
    recoveryId?: string;
    warningId?: string;
  };
  metadata?: Record<string, any>;
}

export interface TimelineResponse {
  eventId: string;
  eventTitle: string;
  district: string;
  currentOperationalStage: 'DETECTION' | 'VERIFICATION' | 'RESPONSE' | 'RECOVERY' | 'RECOVERED';
  totalActivities: number;
  latestActivityTime: string;
  timeline: TimelineItem[];
}

interface AuditTimelineProps {
  eventId: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ eventId }) => {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTimeline = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/audit-timeline/${eventId}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load audit timeline');
      setData(json.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching operational timeline');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Stage Badge Styles
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'RECOVERED':
        return { label: 'RECOVERED', bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'RECOVERY':
        return { label: 'RECOVERY', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'RESPONSE':
        return { label: 'RESPONSE', bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'VERIFICATION':
        return { label: 'VERIFICATION', bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      case 'DETECTION':
      default:
        return { label: 'DETECTION', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  // Event Type Icon Dispatcher
  const renderItemIcon = (type: string) => {
    if (type.startsWith('AI_')) return <Brain size={16} style={{ color: '#818cf8' }} />;
    if (type.startsWith('OFFICIAL_')) return <Radio size={16} style={{ color: '#f43f5e' }} />;
    if (type.startsWith('CITIZEN_') || type.startsWith('INCIDENT_')) return <Users size={16} style={{ color: '#38bdf8' }} />;
    if (type.startsWith('TASK_') || type.startsWith('RESPONSE_')) return <ClipboardList size={16} style={{ color: '#f97316' }} />;
    if (type.startsWith('RESOURCE_')) return <Package size={16} style={{ color: '#a855f7' }} />;
    if (type.startsWith('RECOVERY_')) return <TrendingUp size={16} style={{ color: '#22c55e' }} />;
    return <AlertTriangle size={16} style={{ color: '#eab308' }} />;
  };

  const sortedTimeline = React.useMemo(() => {
    if (!data?.timeline) return [];
    return [...data.timeline].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });
  }, [data?.timeline, sortOrder]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw size={20} className="spin" style={{ marginBottom: '8px' }} />
        <div>Loading operational timeline…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '8px' }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const stageBadge = getStageBadge(data.currentOperationalStage);

  return (
    <div
      style={{
        background: 'var(--card-bg, #1e293b)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border, #334155)',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} style={{ color: '#3b82f6' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Operational Timeline</h3>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: stageBadge.bg,
                color: stageBadge.color,
                border: `1px solid ${stageBadge.border}`,
              }}
            >
              STAGE: {stageBadge.label}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            Multi-source provenance log for <strong>{data.eventTitle}</strong> ({data.district})
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>
            <div>
              Total Activities: <strong style={{ color: '#fff' }}>{data.totalActivities}</strong>
            </div>
            {data.latestActivityTime && (
              <div style={{ fontSize: '0.75rem' }}>
                Latest: {new Date(data.latestActivityTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border, #334155)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {sortedTimeline.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          <Info size={18} style={{ marginBottom: '6px' }} />
          <div>No activity recorded yet for this disaster event.</div>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '28px' }}>
          {/* Vertical Track line */}
          <div
            style={{
              position: 'absolute',
              left: '11px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              background: 'var(--border, #334155)',
            }}
          />

          {sortedTimeline.map((item, idx) => {
            const formattedTime = new Date(item.timestamp).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  marginBottom: '20px',
                }}
              >
                {/* Node icon bubble */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-28px',
                    top: '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--card-bg, #0f172a)',
                    border: '1px solid var(--border, #334155)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  {renderItemIcon(item.eventType)}
                </div>

                {/* Content Card */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#e2e8f0',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {item.eventType}
                      </span>
                      {item.actor && (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          by <strong style={{ color: '#cbd5e1' }}>{item.actor}</strong>
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formattedTime}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 500, lineHeight: 1.4 }}>
                    {item.description}
                  </div>

                  {/* Metadata Chips / Related Object */}
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {Object.entries(item.metadata).map(([k, v]) => {
                        if (v === undefined || v === null || typeof v === 'object') return null;
                        return (
                          <span
                            key={k}
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#94a3b8',
                            }}
                          >
                            {k}: <strong style={{ color: '#cbd5e1' }}>{String(v)}</strong>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditTimeline;
