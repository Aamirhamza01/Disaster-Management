/**
 * RecoveryTrackingPage.tsx
 *
 * Operational recovery tracking for disaster rehabilitation post-initial response.
 * Human-operated tracking tool — clearly marked as OPERATOR UPDATED.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  Edit2,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  X,
  Search,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DisasterEventItem {
  _id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  district: string;
}

export interface RecoveryRecordItem {
  _id: string;
  eventId?: DisasterEventItem | string | null;
  district: string;
  state: string;
  status: 'INITIAL_RESPONSE' | 'STABILIZATION' | 'RECOVERY_IN_PROGRESS' | 'RECOVERED';
  affectedPeople: number;
  peopleAssisted: number;
  sheltersActive: number;
  sheltersClosed: number;
  tasksCompleted: number;
  resourcesDeployed: number;
  infrastructureRestoredPercent: number;
  notes?: string;
  updatedBy?: { name?: string; email?: string } | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  INITIAL_RESPONSE: { label: 'Initial Response', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  STABILIZATION: { label: 'Stabilization', bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' },
  RECOVERY_IN_PROGRESS: { label: 'Recovery In Progress', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  RECOVERED: { label: 'Recovered', bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
};

const DISTRICTS = [
  'Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Udham Singh Nagar',
  'Pauri Garhwal', 'Tehri Garhwal', 'Uttarkashi', 'Chamoli', 'Rudraprayag',
  'Almora', 'Bageshwar', 'Champawat', 'Pithoragarh', 'Varanasi', 'Gorakhpur',
];

export const RecoveryTrackingPage: React.FC = () => {
  const [records, setRecords] = useState<RecoveryRecordItem[]>([]);
  const [events, setEvents] = useState<DisasterEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<RecoveryRecordItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    district: 'Haridwar',
    state: 'Uttarakhand',
    eventId: '',
    status: 'INITIAL_RESPONSE',
    affectedPeople: 500,
    peopleAssisted: 250,
    sheltersActive: 2,
    sheltersClosed: 0,
    tasksCompleted: 10,
    resourcesDeployed: 15,
    infrastructureRestoredPercent: 25,
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Recovery Records
      const resRec = await fetch(`${API_BASE}/api/recovery`, { headers: authHeaders() });
      const dataRec = await resRec.json();
      if (!resRec.ok) throw new Error(dataRec.message || 'Failed to fetch recovery records');
      setRecords(dataRec.records || []);

      // Fetch Events for selection
      const resEvt = await fetch(`${API_BASE}/api/events?limit=50`, { headers: authHeaders() });
      const dataEvt = await resEvt.json();
      if (resEvt.ok && dataEvt.events) {
        setEvents(dataEvt.events);
        if (dataEvt.events.length > 0 && !formData.eventId) {
          setFormData((prev) => ({ ...prev, eventId: dataEvt.events[0]._id }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading recovery tracking data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute summary stats
  const activeCount = records.filter((r) => r.status !== 'RECOVERED').length;
  const initialCount = records.filter((r) => r.status === 'INITIAL_RESPONSE').length;
  const stabilizationCount = records.filter((r) => r.status === 'STABILIZATION').length;
  const inProgressCount = records.filter((r) => r.status === 'RECOVERY_IN_PROGRESS').length;
  const recoveredCount = records.filter((r) => r.status === 'RECOVERED').length;

  const filteredRecords = records.filter((r) => {
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDistrict = r.district.toLowerCase().includes(q);
      const matchEvent = typeof r.eventId === 'object' && r.eventId?.title ? r.eventId.title.toLowerCase().includes(q) : false;
      return matchDistrict || matchEvent;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setFormError(null);
    setFormData({
      district: DISTRICTS[0],
      state: 'Uttarakhand',
      eventId: events.length > 0 ? events[0]._id : '',
      status: 'INITIAL_RESPONSE',
      affectedPeople: 500,
      peopleAssisted: 250,
      sheltersActive: 2,
      sheltersClosed: 0,
      tasksCompleted: 10,
      resourcesDeployed: 15,
      infrastructureRestoredPercent: 25,
      notes: '',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (rec: RecoveryRecordItem) => {
    setEditingRecord(rec);
    setFormError(null);
    const eventIdVal = typeof rec.eventId === 'object' && rec.eventId?._id ? rec.eventId._id : (rec.eventId as string) || '';
    setFormData({
      district: rec.district,
      state: rec.state || 'Uttarakhand',
      eventId: eventIdVal,
      status: rec.status,
      affectedPeople: rec.affectedPeople,
      peopleAssisted: rec.peopleAssisted,
      sheltersActive: rec.sheltersActive,
      sheltersClosed: rec.sheltersClosed,
      tasksCompleted: rec.tasksCompleted,
      resourcesDeployed: rec.resourcesDeployed,
      infrastructureRestoredPercent: rec.infrastructureRestoredPercent,
      notes: rec.notes || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.peopleAssisted > formData.affectedPeople) {
      setFormError('People assisted cannot exceed total affected people');
      return;
    }

    if (formData.infrastructureRestoredPercent < 0 || formData.infrastructureRestoredPercent > 100) {
      setFormError('Infrastructure restored percentage must be between 0 and 100');
      return;
    }

    if (!formData.eventId) {
      setFormError('Disaster Event selection is required');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!editingRecord;
      const url = isEdit ? `${API_BASE}/api/recovery/${editingRecord._id}` : `${API_BASE}/api/recovery`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          district: formData.district,
          state: formData.state,
          eventId: formData.eventId,
          status: formData.status,
          affectedPeople: Number(formData.affectedPeople),
          peopleAssisted: Number(formData.peopleAssisted),
          sheltersActive: Number(formData.sheltersActive),
          sheltersClosed: Number(formData.sheltersClosed),
          tasksCompleted: Number(formData.tasksCompleted),
          resourcesDeployed: Number(formData.resourcesDeployed),
          infrastructureRestoredPercent: Number(formData.infrastructureRestoredPercent),
          notes: formData.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Operation failed');

      setIsCreateOpen(false);
      setEditingRecord(null);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save recovery record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-primary, #f8fafc)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={28} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Recovery Tracking</h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                letterSpacing: '0.5px',
              }}
            >
              OPERATOR UPDATED
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
            Track post-disaster rehabilitation progress, active/closed shelters, and infrastructure restoration across affected districts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border, #334155)',
              color: 'var(--text-primary, #f8fafc)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: '#2563eb',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            New Recovery Record
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Active Recoveries */}
        <div
          style={{
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              Active Recoveries
            </span>
            <Activity size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{activeCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            In response or rehabilitation
          </div>
        </div>

        {/* Initial Response */}
        <div
          style={{
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              Initial Response
            </span>
            <ShieldAlert size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>{initialCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Immediate relief operations
          </div>
        </div>

        {/* Stabilization */}
        <div
          style={{
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              Stabilization
            </span>
            <Clock size={18} style={{ color: '#f97316' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f97316' }}>{stabilizationCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Basic services restoring
          </div>
        </div>

        {/* Recovery In Progress */}
        <div
          style={{
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              Recovery In Progress
            </span>
            <TrendingUp size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6' }}>{inProgressCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Rebuilding infrastructure
          </div>
        </div>

        {/* Recovered */}
        <div
          style={{
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              Recovered
            </span>
            <CheckCircle size={18} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#22c55e' }}>{recoveredCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Normalcy restored
          </div>
        </div>
      </div>

      {/* Filters & Actions bar */}
      <div
        style={{
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '8px 8px 0 0',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Search district or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border, #334155)',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border, #334155)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="INITIAL_RESPONSE">Initial Response</option>
            <option value="STABILIZATION">Stabilization</option>
            <option value="RECOVERY_IN_PROGRESS">Recovery In Progress</option>
            <option value="RECOVERED">Recovered</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
          Showing <strong>{filteredRecords.length}</strong> of {records.length} records
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border, #334155)', color: '#94a3b8' }}>
              <th style={{ padding: '12px 16px' }}>District</th>
              <th style={{ padding: '12px 16px' }}>Disaster Event</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Affected People</th>
              <th style={{ padding: '12px 16px' }}>People Assisted</th>
              <th style={{ padding: '12px 16px' }}>Tasks Done</th>
              <th style={{ padding: '12px 16px' }}>Resources</th>
              <th style={{ padding: '12px 16px', width: '180px' }}>Infrastructure Restored</th>
              <th style={{ padding: '12px 16px' }}>Last Updated</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && records.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading recovery records...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No recovery records found. Create one to start tracking.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const st = STATUS_LABELS[r.status] || { label: r.status, bg: '#334155', color: '#fff', border: '#475569' };
                const eventTitle = typeof r.eventId === 'object' && r.eventId?.title ? r.eventId.title : 'General Event';
                const pct = r.infrastructureRestoredPercent ?? 0;

                return (
                  <tr
                    key={r._id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* District */}
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.district}</td>

                    {/* Event */}
                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                      <div style={{ fontWeight: 500 }}>{eventTitle}</div>
                      {typeof r.eventId === 'object' && r.eventId?.type && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.eventId.type}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {st.label}
                      </span>
                    </td>

                    {/* Affected People */}
                    <td style={{ padding: '12px 16px' }}>{r.affectedPeople.toLocaleString()}</td>

                    {/* People Assisted */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#22c55e' }}>{r.peopleAssisted.toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {r.affectedPeople > 0
                          ? `${Math.round((r.peopleAssisted / r.affectedPeople) * 100)}% covered`
                          : 'N/A'}
                      </div>
                    </td>

                    {/* Tasks Completed */}
                    <td style={{ padding: '12px 16px' }}>{r.tasksCompleted}</td>

                    {/* Resources Deployed */}
                    <td style={{ padding: '12px 16px' }}>{r.resourcesDeployed}</td>

                    {/* Infrastructure Restored */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: pct >= 80 ? '#22c55e' : pct >= 40 ? '#60a5fa' : '#f97316' }}>
                          {pct}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          width: '100%',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(0, pct))}%`,
                            background: pct >= 80 ? '#22c55e' : pct >= 40 ? '#3b82f6' : '#f97316',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <div>{new Date(r.updatedAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem' }}>{new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEdit(r)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Edit2 size={14} />
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingRecord) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--card-bg, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {editingRecord ? `Update Recovery Record — ${editingRecord.district}` : 'Create Recovery Record'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingRecord(null);
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* District */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    District *
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    disabled={!!editingRecord}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Disaster Event *
                  </label>
                  <select
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    disabled={!!editingRecord}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  >
                    {events.length === 0 ? (
                      <option value="">No events available</option>
                    ) : (
                      events.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.title} ({e.district})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  >
                    <option value="INITIAL_RESPONSE">Initial Response</option>
                    <option value="STABILIZATION">Stabilization</option>
                    <option value="RECOVERY_IN_PROGRESS">Recovery In Progress</option>
                    <option value="RECOVERED">Recovered</option>
                  </select>
                </div>

                {/* Infrastructure Restored % */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Infrastructure Restored (%): {formData.infrastructureRestoredPercent}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.infrastructureRestoredPercent}
                    onChange={(e) => setFormData({ ...formData, infrastructureRestoredPercent: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#3b82f6', marginTop: '6px' }}
                  />
                </div>

                {/* Affected People */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Affected People
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.affectedPeople}
                    onChange={(e) => setFormData({ ...formData, affectedPeople: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  />
                </div>

                {/* People Assisted */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    People Assisted (Max: {formData.affectedPeople})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.affectedPeople}
                    value={formData.peopleAssisted}
                    onChange={(e) => setFormData({ ...formData, peopleAssisted: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  />
                </div>

                {/* Tasks Completed */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Tasks Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tasksCompleted}
                    onChange={(e) => setFormData({ ...formData, tasksCompleted: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  />
                </div>

                {/* Resources Deployed */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Resources Deployed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.resourcesDeployed}
                    onChange={(e) => setFormData({ ...formData, resourcesDeployed: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  />
                </div>

                {/* Shelters Active */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Shelters Active
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sheltersActive}
                    onChange={(e) => setFormData({ ...formData, sheltersActive: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  />
                </div>

                {/* Shelters Closed */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Shelters Closed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sheltersClosed}
                    onChange={(e) => setFormData({ ...formData, sheltersClosed: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border, #334155)',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                  Operational Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Details on power restoration, road clearance, medical support..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border, #334155)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingRecord(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'none',
                    border: '1px solid var(--border, #334155)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: '#2563eb',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : editingRecord ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryTrackingPage;
