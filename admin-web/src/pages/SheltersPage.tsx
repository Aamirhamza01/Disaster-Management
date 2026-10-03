import { useState, useEffect } from 'react';
import {
  Home, PlusCircle, RefreshCw, CheckCircle,
  Filter, Users, Phone, AlertCircle
} from 'lucide-react';
import { getShelters, createShelter, updateShelterOccupancy } from '../api/services';
import type { Shelter, ShelterStatus } from '../types';
import DataStatusBadge from '../components/DataStatusBadge';

const DISTRICT_LIST = [
  'All Districts',
  'Haridwar',
  'Dehradun',
  'Nainital',
  'Udham Singh Nagar',
  'Pauri Garhwal',
  'Tehri Garhwal',
  'Uttarkashi',
  'Chamoli',
];

export default function SheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [occupancyModalOpen, setOccupancyModalOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [newOccupancy, setNewOccupancy] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New Shelter Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    district: 'Haridwar',
    state: 'Utt',
    capacity: 250,
    currentOccupancy: 0,
    contactNumber: '+91 94150 00000',
    facilities: 'Clean Water, Food Supply, First Aid, Sanitation, Power Backup',
  });

  const fetchShelters = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getShelters({
        district: districtFilter === 'All Districts' ? undefined : districtFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setShelters(res.data.shelters || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch shelters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, [districtFilter, statusFilter]);

  const handleUpdateOccupancy = async () => {
    if (!selectedShelter) return;
    setActionLoading(true);
    try {
      await updateShelterOccupancy(selectedShelter._id, newOccupancy);
      setSuccessMsg(`Occupancy updated for ${selectedShelter.name}`);
      setOccupancyModalOpen(false);
      fetchShelters();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update occupancy');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createShelter({
        ...formData,
        facilities: formData.facilities.split(',').map((s) => s.trim()),
      });
      setSuccessMsg('New relief shelter registered successfully');
      setCreateModalOpen(false);
      fetchShelters();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to register shelter');
    } finally {
      setActionLoading(false);
    }
  };

  const totalCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const availableSheltersCount = shelters.filter((s) => s.status === 'AVAILABLE').length;
  const fullSheltersCount = shelters.filter((s) => s.status === 'FULL').length;

  const getStatusBadge = (status: ShelterStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>AVAILABLE</span>;
      case 'NEAR_CAPACITY':
        return <span style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>NEAR CAPACITY</span>;
      case 'FULL':
        return <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>FULL</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>CLOSED</span>;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="topbar">
        <div className="topbar-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Home size={20} color="var(--blue-600)" />
            <span className="topbar-title">Evacuation & Relief Shelters</span>
            <DataStatusBadge status="LIVE" size="sm" />
          </div>
          <span className="topbar-subtitle">
            Relief camps, real-time occupancy monitoring, and capacity management
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchShelters}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setCreateModalOpen(true)}
          >
            <PlusCircle size={14} /> Register Shelter
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

        {/* Summary KPIs */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card kpi-card kpi-card--active">
            <div className="stat-card-header">
              <span className="stat-indicator kpi-icon kpi-icon--active"><Home size={14} /></span>
              <span className="stat-label">Total Shelters</span>
            </div>
            <div className="stat-value">{shelters.length}</div>
            <div className="stat-sub">{totalCapacity.toLocaleString()} total capacity</div>
          </div>

          <div className="stat-card kpi-card kpi-card--alerts">
            <div className="stat-card-header">
              <span className="stat-indicator kpi-icon kpi-icon--alerts"><CheckCircle size={14} /></span>
              <span className="stat-label">Available Shelters</span>
            </div>
            <div className="stat-value">{availableSheltersCount}</div>
            <div className="stat-sub">Ready for immediate intake</div>
          </div>

          <div className="stat-card kpi-card kpi-card--pushes">
            <div className="stat-card-header">
              <span className="stat-indicator kpi-icon kpi-icon--pushes"><Users size={14} /></span>
              <span className="stat-label">Current Occupancy</span>
            </div>
            <div className="stat-value">{totalOccupancy.toLocaleString()}</div>
            <div className="stat-sub">
              {totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}% network load
            </div>
          </div>

          <div className="stat-card kpi-card kpi-card--logs">
            <div className="stat-card-header">
              <span className="stat-indicator kpi-icon kpi-icon--logs"><AlertCircle size={14} /></span>
              <span className="stat-label">Full Shelters</span>
            </div>
            <div className="stat-value">{fullSheltersCount}</div>
            <div className="stat-sub">Require divert routing</div>
          </div>
        </div>

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
                style={{ width: 160, padding: '4px 8px', fontSize: 13 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="NEAR_CAPACITY">NEAR_CAPACITY</option>
                <option value="FULL">FULL</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shelters Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, margin: 0 }}>Registered Relief Facilities ({shelters.length})</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--grey-500)' }}>
                Government schools, stadiums, and cyclone shelters configured for evacuees
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading-center">
              <span className="spinner" />
              <span>Loading shelters…</span>
            </div>
          ) : shelters.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <Home size={32} color="var(--blue-600)" />
              <h3 style={{ marginTop: 12 }}>No shelters found</h3>
              <p>Register relief shelters for this district to coordinate civilian evacuation.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
                Register First Shelter
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Shelter Name & Address</th>
                    <th>District</th>
                    <th>Capacity / Occupancy</th>
                    <th>Load %</th>
                    <th>Status</th>
                    <th>Key Facilities</th>
                    <th>Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shelters.map((sh) => {
                    const pct = sh.occupancyPercentage || (sh.capacity > 0 ? Math.round((sh.currentOccupancy / sh.capacity) * 100) : 0);
                    return (
                      <tr key={sh._id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{sh.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--grey-500)' }}>{sh.address}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{sh.district}</td>
                        <td>
                          <strong>{sh.currentOccupancy}</strong> / {sh.capacity} persons
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, width: 32 }}>{pct}%</span>
                            <div style={{ width: 70, height: 6, background: 'var(--grey-200)', borderRadius: 3, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#16a34a',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(sh.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
                            {sh.facilities?.map((f, i) => (
                              <span key={i} style={{ fontSize: 10, background: 'var(--grey-100)', padding: '2px 5px', borderRadius: 4 }}>
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={11} color="var(--grey-500)" />
                            <span>{sh.contactNumber}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => {
                              setSelectedShelter(sh);
                              setNewOccupancy(sh.currentOccupancy);
                              setOccupancyModalOpen(true);
                            }}
                          >
                            Update
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

      {/* ── Update Occupancy Modal ───────────────────────────────────────── */}
      {occupancyModalOpen && selectedShelter && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Update Shelter Occupancy</h3>
              <button onClick={() => setOccupancyModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--grey-600)', marginBottom: 12 }}>
                Shelter: <strong>{selectedShelter.name}</strong> ({selectedShelter.district})<br />
                Max Capacity: <strong>{selectedShelter.capacity} persons</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Current Occupancy (Persons)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  max={selectedShelter.capacity}
                  value={newOccupancy}
                  onChange={(e) => setNewOccupancy(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setOccupancyModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleUpdateOccupancy} disabled={actionLoading}>
                  Save Occupancy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Shelter Modal ────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Register Evacuation Shelter</h3>
              <button onClick={() => setCreateModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateShelter} className="modal-body">
              <div className="form-group">
                <label className="form-label">Shelter Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Government Degree College Relief Camp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address / Landmark</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Near Sigra Stadium, Varanasi"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

                <div className="form-group">
                  <label className="form-label">Total Capacity (Persons)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    className="form-input"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Facilities (Comma Separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                  Register Shelter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
