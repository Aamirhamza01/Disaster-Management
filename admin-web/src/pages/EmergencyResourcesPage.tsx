import { useState, useEffect } from 'react';
import {
  Package, PlusCircle, RefreshCw, CheckCircle,
  Filter, AlertTriangle, Truck, ArrowRightCircle, RotateCcw
} from 'lucide-react';
import {
  getResources, getResourceSummary, createResource,
  allocateResource, releaseResource
} from '../api/services';
import type { EmergencyResource, ResourceSummary, ResourceStatus } from '../types';
import DataStatusBadge from '../components/DataStatusBadge';

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

const RESOURCE_TYPES = [
  'Ambulance',
  'Rescue Vehicle',
  'Medical Kit',
  'Food Pack',
  'Water',
  'Rescue Equipment',
  'Temporary Shelter Kit',
  'Other',
];

export default function EmergencyResourcesPage() {
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [summary, setSummary] = useState<ResourceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<EmergencyResource | null>(null);
  const [allocQty, setAllocQty] = useState(1);
  const [allocTarget, setAllocTarget] = useState('SDRF Unit 1');
  const [releaseQty, setReleaseQty] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New Resource Form
  const [formData, setFormData] = useState({
    name: '',
    resourceType: 'Rescue Vehicle',
    quantity: 10,
    unit: 'vehicles',
    district: 'Haridwar',
    state: 'Uttarakhand',
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const dist = districtFilter === 'All Districts' ? undefined : districtFilter;
      const [resList, resSum] = await Promise.all([
        getResources({
          district: dist,
          resourceType: typeFilter === 'ALL' ? undefined : typeFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        }),
        getResourceSummary(dist),
      ]);
      setResources(resList.data.resources || []);
      setSummary(resSum.data.stats || null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch emergency resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [districtFilter, typeFilter, statusFilter]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createResource(formData);
      setSuccessMsg('Emergency resource registered in inventory');
      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create resource');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedResource) return;
    setActionLoading(true);
    try {
      await allocateResource(selectedResource._id, {
        quantity: allocQty,
        assignedTo: allocTarget,
      });
      setSuccessMsg(`Allocated ${allocQty} ${selectedResource.unit} to ${allocTarget}`);
      setAllocModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Allocation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedResource) return;
    setActionLoading(true);
    try {
      await releaseResource(selectedResource._id, {
        quantity: releaseQty,
      });
      setSuccessMsg(`Released ${releaseQty} ${selectedResource.unit} back to available stock`);
      setReleaseModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Release failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>AVAILABLE</span>;
      case 'LOW_STOCK':
        return <span style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>LOW STOCK</span>;
      case 'ALLOCATED':
        return <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>ALLOCATED</span>;
      default:
        return <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>OUT OF SERVICE</span>;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="topbar">
        <div className="topbar-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={20} color="var(--blue-600)" />
            <span className="topbar-title">Emergency Resource Inventory</span>
            <DataStatusBadge status="LIVE" size="sm" />
          </div>
          <span className="topbar-subtitle">
            Relief supplies, rescue boats, ambulances, medical kits & field allocation
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
            <PlusCircle size={14} /> Add Resource
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
            <div className="stat-card kpi-card kpi-card--active">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--active"><Package size={14} /></span>
                <span className="stat-label">Total Resources</span>
              </div>
              <div className="stat-value">{summary.total}</div>
              <div className="stat-sub">Tracked inventory lines</div>
            </div>

            <div className="stat-card kpi-card kpi-card--alerts">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--alerts"><CheckCircle size={14} /></span>
                <span className="stat-label">Available</span>
              </div>
              <div className="stat-value" style={{ color: '#065f46' }}>{summary.available}</div>
              <div className="stat-sub">Ready to deploy</div>
            </div>

            <div className="stat-card kpi-card kpi-card--pushes">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--pushes"><Truck size={14} /></span>
                <span className="stat-label">Allocated</span>
              </div>
              <div className="stat-value" style={{ color: '#1e40af' }}>{summary.allocated}</div>
              <div className="stat-sub">Assigned to field teams</div>
            </div>

            <div className="stat-card kpi-card kpi-card--logs">
              <div className="stat-card-header">
                <span className="stat-indicator kpi-icon kpi-icon--logs"><AlertTriangle size={14} /></span>
                <span className="stat-label">Low Stock</span>
              </div>
              <div className="stat-value" style={{ color: '#d97706' }}>{summary.lowStock}</div>
              <div className="stat-sub">Below 20% buffer</div>
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
              <label style={{ fontSize: 12, color: 'var(--grey-600)' }}>Type:</label>
              <select
                className="form-input"
                style={{ width: 160, padding: '4px 8px', fontSize: 13 }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
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
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="LOW_STOCK">LOW_STOCK</option>
                <option value="ALLOCATED">ALLOCATED</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resources Inventory Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, margin: 0 }}>Inventory Catalogue ({resources.length})</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--grey-500)' }}>
                Field assets ready for disaster deployment
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading-center">
              <span className="spinner" />
              <span>Loading resources…</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <Package size={32} color="var(--blue-600)" />
              <h3 style={{ marginTop: 12 }}>No resources in inventory</h3>
              <p>Add ambulances, medical kits, and rescue boats to manage disaster allocation.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
                Add First Resource
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Resource Name</th>
                    <th>Type</th>
                    <th>District</th>
                    <th>Available / Total</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res._id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{res.name}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--blue-700)', fontSize: 12 }}>
                        {res.resourceType}
                      </td>
                      <td style={{ fontWeight: 600 }}>{res.district}</td>
                      <td>
                        <strong style={{ fontSize: 13, color: res.availableQuantity === 0 ? '#dc2626' : '#065f46' }}>
                          {res.availableQuantity}
                        </strong> / {res.quantity} {res.unit}
                      </td>
                      <td>{getStatusBadge(res.status)}</td>
                      <td className="muted-cell" style={{ fontSize: 12 }}>
                        {res.assignedTo || 'Unassigned'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: '3px 8px' }}
                            disabled={res.availableQuantity === 0}
                            onClick={() => {
                              setSelectedResource(res);
                              setAllocQty(1);
                              setAllocModalOpen(true);
                            }}
                          >
                            <ArrowRightCircle size={12} /> Allocate
                          </button>
                          {res.availableQuantity < res.quantity && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '3px 8px' }}
                              onClick={() => {
                                setSelectedResource(res);
                                setReleaseQty(res.quantity - res.availableQuantity);
                                setReleaseModalOpen(true);
                              }}
                            >
                              <RotateCcw size={12} /> Release
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

      {/* ── Allocate Modal ─────────────────────────────────────────────── */}
      {allocModalOpen && selectedResource && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Allocate Resource</h3>
              <button onClick={() => setAllocModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--grey-600)', marginBottom: 12 }}>
                Resource: <strong>{selectedResource.name}</strong> ({selectedResource.resourceType})<br />
                Available: <strong>{selectedResource.availableQuantity} {selectedResource.unit}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Units to Allocate</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={selectedResource.availableQuantity}
                  value={allocQty}
                  onChange={(e) => setAllocQty(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign To (Unit / Task)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. NDRF Team 4 / Varanasi Relief Camp"
                  value={allocTarget}
                  onChange={(e) => setAllocTarget(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setAllocModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleAllocate} disabled={actionLoading}>
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Release Modal ──────────────────────────────────────────────── */}
      {releaseModalOpen && selectedResource && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Release Resource back to Stock</h3>
              <button onClick={() => setReleaseModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--grey-600)', marginBottom: 12 }}>
                Resource: <strong>{selectedResource.name}</strong><br />
                Currently Allocated: <strong>{selectedResource.quantity - selectedResource.availableQuantity} {selectedResource.unit}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Units to Return to Available Stock</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={selectedResource.quantity - selectedResource.availableQuantity}
                  value={releaseQty}
                  onChange={(e) => setReleaseQty(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setReleaseModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleRelease} disabled={actionLoading}>
                  Confirm Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Resource Modal ──────────────────────────────────────── */}
      {createModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Add Emergency Resource</h3>
              <button onClick={() => setCreateModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateResource} className="modal-body">
              <div className="form-group">
                <label className="form-label">Resource Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Inflatable Rescue Boat with OBM"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Resource Type</label>
                  <select
                    className="form-input"
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">District</label>
                  <select
                    className="form-input"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  >
                    {DISTRICT_LIST.filter((d) => d !== 'All Districts').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Total Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. units, kits, boxes"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
