import { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, XCircle, ArrowUpRight,
  Filter, RefreshCw, Users
} from 'lucide-react';
import { getIncidents, updateIncidentStatus, createTaskFromIncident } from '../api/services';
import type { IncidentReport, IncidentStatus } from '../types';
import DataStatusBadge from '../components/DataStatusBadge';
import { format } from 'date-fns';

const DISTRICT_LIST = [
  'All Districts',
  'Varanasi',
  'Gorakhpur',
  'Prayagraj',
  'Lucknow',
  'Ayodhya',
  'Kanpur',
  'Mirzapur',
  'Ballia',
];

export default function IncidentReportsPage() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getIncidents({
        district: districtFilter === 'All Districts' ? undefined : districtFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setReports(res.data.reports || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch incident reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [districtFilter, statusFilter]);

  const handleUpdateStatus = async (id: string, status: IncidentStatus) => {
    setActionLoading(id);
    try {
      await updateIncidentStatus(id, { status, reviewNotes });
      setSuccessMsg(`Incident successfully updated to ${status}`);
      setReviewNotes('');
      setModalOpen(false);
      fetchReports();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTask = async (id: string) => {
    setActionLoading(id);
    try {
      await createTaskFromIncident(id, {
        taskTitle: selectedReport ? `[Field Task] ${selectedReport.title}` : undefined,
        assignedTo: 'District Disaster Quick Response Team',
        dueHours: 4,
      });
      setSuccessMsg('Operational response task generated and assigned successfully');
      setModalOpen(false);
      fetchReports();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create response task');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'VERIFIED': return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      case 'ASSIGNED': return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
      case 'RESOLVED': return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' };
      case 'REJECTED': return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      case 'UNDER_REVIEW': return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
      default: return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    }
  };

  return (
    <div className="dashboard-page">
      <div className="topbar">
        <div className="topbar-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="var(--blue-600)" />
            <span className="topbar-title">Citizen Incident Reports</span>
            <DataStatusBadge status="LIVE" size="sm" />
          </div>
          <span className="topbar-subtitle">
            Crowdsourced disaster observations, ground-truth verifications & responder dispatch
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchReports}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh Feed
        </button>
      </div>

      <div className="page-content">
        {successMsg && (
          <div style={{
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            padding: '10px 16px',
            borderRadius: 6,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
          }}>
            <CheckCircle size={16} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            padding: '10px 16px',
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}>
            {errorMsg}
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>
              <Filter size={15} /> Filters:
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--grey-600)' }}>District:</label>
              <select
                className="form-input"
                style={{ width: 160, padding: '4px 8px', fontSize: 13 }}
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
              >
                {DISTRICT_LIST.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--grey-600)' }}>Status:</label>
              <select
                className="form-input"
                style={{ width: 150, padding: '4px 8px', fontSize: 13 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incident Reports Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, margin: 0 }}>Incident Feed ({reports.length})</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--grey-500)' }}>
                Reports submitted by citizens and field observers
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading-center">
              <span className="spinner" />
              <span>Loading incident feed…</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <CheckCircle size={32} color="var(--emerald-600)" />
              <h3 style={{ marginTop: 12 }}>No incidents reported</h3>
              <p>No citizen reports matching selected criteria.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title & Type</th>
                    <th>District</th>
                    <th>Severity</th>
                    <th>People Affected</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => {
                    const stStyle = getStatusColor(rep.status);
                    return (
                      <tr key={rep._id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{rep.title}</div>
                          <span style={{ fontSize: 11, color: 'var(--blue-600)', fontWeight: 600 }}>
                            {rep.incidentType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{rep.district}</td>
                        <td>
                          <span className={`severity-badge ${rep.severity}`}>{rep.severity}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={13} color="var(--grey-500)" />
                            <strong>{rep.peopleAffected}</strong>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>{rep.citizenName}</div>
                          {rep.citizenPhone && (
                            <div style={{ fontSize: 11, color: 'var(--grey-500)' }}>{rep.citizenPhone}</div>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: stStyle.bg,
                              color: stStyle.text,
                              border: `1px solid ${stStyle.border}`,
                              textTransform: 'uppercase',
                            }}
                          >
                            {rep.status}
                          </span>
                        </td>
                        <td className="muted-cell" style={{ fontSize: 11 }}>
                          {format(new Date(rep.createdAt), 'd MMM, HH:mm')}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => {
                              setSelectedReport(rep);
                              setModalOpen(true);
                            }}
                          >
                            Review & Act
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Review & Action Modal ───────────────────────────────────────── */}
      {modalOpen && selectedReport && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>Incident Review: {selectedReport.title}</h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span className={`severity-badge ${selectedReport.severity}`}>
                  {selectedReport.severity}
                </span>
                <span style={{ background: 'var(--grey-100)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                  {selectedReport.incidentType}
                </span>
                <span style={{ background: 'var(--grey-100)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                  District: {selectedReport.district}
                </span>
              </div>

              <div style={{ background: 'var(--grey-50)', padding: 12, borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                <strong>Description:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--grey-800)' }}>{selectedReport.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, marginBottom: 16 }}>
                <div>
                  <span style={{ color: 'var(--grey-500)' }}>Reporter Contact:</span>
                  <div>{selectedReport.citizenName} ({selectedReport.citizenPhone || 'No phone'})</div>
                </div>
                <div>
                  <span style={{ color: 'var(--grey-500)' }}>People Affected:</span>
                  <div><strong>{selectedReport.peopleAffected} civilians</strong></div>
                </div>
                <div>
                  <span style={{ color: 'var(--grey-500)' }}>Coordinates:</span>
                  <div>[{selectedReport.location.coordinates[0].toFixed(4)}, {selectedReport.location.coordinates[1].toFixed(4)}]</div>
                </div>
                <div>
                  <span style={{ color: 'var(--grey-500)' }}>Current Status:</span>
                  <div><strong>{selectedReport.status}</strong></div>
                </div>
              </div>

              {selectedReport.associatedTaskId && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 14,
                  fontSize: 12,
                }}>
                  <strong>Assigned Task:</strong> {selectedReport.associatedTaskId.title} (Status: {selectedReport.associatedTaskId.status})
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Review Notes / Operator Comments</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Verification details, casualty assessment, or field instructions..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleUpdateStatus(selectedReport._id, 'REJECTED')}
                    disabled={actionLoading === selectedReport._id}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#16a34a' }}
                    onClick={() => handleUpdateStatus(selectedReport._id, 'VERIFIED')}
                    disabled={actionLoading === selectedReport._id}
                  >
                    <CheckCircle size={14} /> Mark Verified
                  </button>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleCreateTask(selectedReport._id)}
                  disabled={actionLoading === selectedReport._id}
                >
                  <ArrowUpRight size={14} /> Create Response Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
