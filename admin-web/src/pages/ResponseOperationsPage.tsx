import { useState, useEffect } from 'react';
import {
  ClipboardList, PlusCircle, RefreshCw, CheckCircle,
  Filter, AlertTriangle, Users, Clock, ArrowRight,
  PackageCheck
} from 'lucide-react';
import {
  getTasks, getTaskSummary, createTask, assignTask,
  updateTaskStatus, getResources, allocateResourceToTask
} from '../api/services';
import type {
  ResponseTask, TaskSummary, TaskPriority, TaskStatus,
  EmergencyResource
} from '../types';
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

export default function ResponseOperationsPage() {
  const [tasks, setTasks] = useState<ResponseTask[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ResponseTask | null>(null);

  // Form states
  const [assignedToInput, setAssignedToInput] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [resourceQtyInput, setResourceQtyInput] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New Task Form
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    district: 'Varanasi',
    priority: 'HIGH' as TaskPriority,
    assignedTo: 'SDRF Quick Response Team',
    dueHours: 6,
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const dist = districtFilter === 'All Districts' ? undefined : districtFilter;
      const [taskRes, sumRes, resList] = await Promise.all([
        getTasks({
          district: dist,
          priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        }),
        getTaskSummary(dist),
        getResources({ district: dist, status: 'AVAILABLE' }).catch(() => ({ data: { resources: [] } })),
      ]);
      setTasks(taskRes.data.tasks || []);
      setSummary(sumRes.data.stats || null);
      setResources(resList.data.resources || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch response operations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [districtFilter, priorityFilter, statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createTask(newTaskData);
      setSuccessMsg('Response task generated and assigned');
      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await assignTask(selectedTask._id, assignedToInput);
      setSuccessMsg(`Task assigned to ${assignedToInput}`);
      setAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Assignment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      setSuccessMsg(`Task moved to ${status}`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleAllocateResource = async () => {
    if (!selectedTask || !selectedResourceId) return;
    setActionLoading(true);
    try {
      await allocateResourceToTask(selectedTask._id, {
        resourceId: selectedResourceId,
        quantity: resourceQtyInput,
      });
      setSuccessMsg('Resource allocated to operational task');
      setResourceModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Resource allocation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>MEDIUM</span>;
      default:
        return <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>LOW</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>COMPLETED</span>;
      case 'IN_PROGRESS':
        return <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>IN PROGRESS</span>;
      case 'ASSIGNED':
        return <span style={{ background: '#faf5ff', color: '#6b21a8', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>ASSIGNED</span>;
      case 'CANCELLED':
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>CANCELLED</span>;
      default:
        return <span style={{ background: '#fffbeb', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>PENDING</span>;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="topbar">
        <div className="topbar-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={20} color="var(--blue-600)" />
            <span className="topbar-title">Response Operations & Tasks</span>
            <DataStatusBadge status="LIVE" size="sm" />
          </div>
          <span className="topbar-subtitle">
            Field rescue task dispatch, responder assignments, and resource coordination
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
            <PlusCircle size={14} /> Create Task
          </button>
        </div>
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

        {/* KPI Summary Cards */}
        {summary && (
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card kpi-card kpi-card--alerts">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--alerts"><Clock size={14} /></span>
                <span className="stat-label">Pending Tasks</span>
              </div>
              <div className="stat-value">{summary.pending}</div>
              <div className="stat-sub">Awaiting responder assignment</div>
            </div>

            <div className="stat-card kpi-card kpi-card--pushes">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--pushes"><ArrowRight size={14} /></span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-value" style={{ color: '#1e40af' }}>{summary.inProgress}</div>
              <div className="stat-sub">Active field operations</div>
            </div>

            <div className="stat-card kpi-card kpi-card--logs">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--logs"><AlertTriangle size={14} /></span>
                <span className="stat-label">Critical Priority</span>
              </div>
              <div className="stat-value" style={{ color: '#dc2626' }}>{summary.critical}</div>
              <div className="stat-sub">Immediate life safety impact</div>
            </div>

            <div className="stat-card kpi-card kpi-card--active">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--active"><CheckCircle size={14} /></span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-value" style={{ color: '#065f46' }}>{summary.completed}</div>
              <div className="stat-sub">Successfully resolved</div>
            </div>
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
              <label style={{ fontSize: 12, color: 'var(--grey-600)' }}>Priority:</label>
              <select
                className="form-input"
                style={{ width: 150, padding: '4px 8px', fontSize: 13 }}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
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
                <option value="PENDING">PENDING</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, margin: 0 }}>Operational Task Queue ({tasks.length})</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--grey-500)' }}>
                Field operations, responder dispatches, and life-safety response items
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading-center">
              <span className="spinner" />
              <span>Loading tasks…</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <ClipboardList size={32} color="var(--blue-600)" />
              <h3 style={{ marginTop: 12 }}>No response tasks</h3>
              <p>Create response tasks to dispatch field units or verify citizen incidents.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
                Create First Task
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task & Description</th>
                    <th>District</th>
                    <th>Priority</th>
                    <th>Assigned Responder</th>
                    <th>Status</th>
                    <th>Allocated Resources</th>
                    <th>Due Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{task.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--grey-600)', maxWidth: 260 }}>{task.description}</div>
                        {task.incidentId && (
                          <div style={{ fontSize: 10, color: 'var(--blue-600)', marginTop: 2 }}>
                            Linked to Citizen Incident ({task.incidentId.incidentType})
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{task.district}</td>
                      <td>{getPriorityBadge(task.priority)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={12} color="var(--grey-500)" />
                          <span style={{ fontSize: 12 }}>{task.assignedTo}</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(task.status)}</td>
                      <td>
                        {task.allocatedResources && task.allocatedResources.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 160 }}>
                            {task.allocatedResources.map((r, i) => (
                              <span key={i} style={{ fontSize: 10, background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 5px', borderRadius: 4 }}>
                                {r.quantity}× {r.resourceName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="muted-cell" style={{ fontSize: 11 }}>None</span>
                        )}
                      </td>
                      <td className="muted-cell" style={{ fontSize: 11 }}>
                        {task.dueAt ? format(new Date(task.dueAt), 'd MMM, HH:mm') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: '2px 6px' }}
                            onClick={() => {
                              setSelectedTask(task);
                              setAssignedToInput(task.assignedTo);
                              setAssignModalOpen(true);
                            }}
                          >
                            Assign
                          </button>

                          {task.status !== 'COMPLETED' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '2px 6px' }}
                              onClick={() => {
                                setSelectedTask(task);
                                setResourceModalOpen(true);
                              }}
                            >
                              <PackageCheck size={11} /> +Asset
                            </button>
                          )}

                          {task.status === 'ASSIGNED' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '2px 6px', color: '#1e40af' }}
                              onClick={() => handleUpdateStatus(task._id, 'IN_PROGRESS')}
                            >
                              Start
                            </button>
                          )}

                          {task.status === 'IN_PROGRESS' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '2px 6px', color: '#065f46' }}
                              onClick={() => handleUpdateStatus(task._id, 'COMPLETED')}
                            >
                              Done
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign Task Modal ───────────────────────────────────────────── */}
      {assignModalOpen && selectedTask && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Assign Task Responder</h3>
              <button onClick={() => setAssignModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--grey-600)', marginBottom: 12 }}>
                Task: <strong>{selectedTask.title}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Assigned Unit / Officer</label>
                <input
                  type="text"
                  className="form-input"
                  value={assignedToInput}
                  onChange={(e) => setAssignedToInput(e.target.value)}
                  placeholder="e.g. NDRF 11th Bn / Varanasi Civil Defense"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setAssignModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleAssignTask} disabled={actionLoading}>
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Allocate Resource to Task Modal ─────────────────────────────── */}
      {resourceModalOpen && selectedTask && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Allocate Asset to Task</h3>
              <button onClick={() => setResourceModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--grey-600)', marginBottom: 12 }}>
                Target Task: <strong>{selectedTask.title}</strong> ({selectedTask.district})
              </p>

              <div className="form-group">
                <label className="form-label">Select Available Resource</label>
                <select
                  className="form-input"
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                >
                  <option value="">-- Choose asset from inventory --</option>
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.resourceType}) — {r.availableQuantity} {r.unit} available
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity to Allocate</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={resourceQtyInput}
                  onChange={(e) => setResourceQtyInput(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setResourceModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAllocateResource}
                  disabled={actionLoading || !selectedResourceId}
                >
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Task Modal ───────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Create Response Task</h3>
              <button onClick={() => setCreateModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-body">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Deploy inflatable rescue boats to Sigra ward"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  required
                  className="form-input"
                  rows={3}
                  placeholder="Operation details, route checkpoints, casualties, equipment required..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <select
                    className="form-input"
                    value={newTaskData.district}
                    onChange={(e) => setNewTaskData({ ...newTaskData, district: e.target.value })}
                  >
                    {DISTRICT_LIST.filter((d) => d !== 'All Districts').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as TaskPriority })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Assigned Unit</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTaskData.assignedTo}
                    onChange={(e) => setNewTaskData({ ...newTaskData, assignedTo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due in (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    className="form-input"
                    value={newTaskData.dueHours}
                    onChange={(e) => setNewTaskData({ ...newTaskData, dueHours: parseInt(e.target.value, 10) || 6 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
