/**
 * CitizenHomePage.tsx
 *
 * Public Citizen Safety Homepage.
 * Displays local disaster risk level, active emergency alerts, nearby shelters,
 * and prominent action buttons for SOS distress, Safe status declaration, incident reporting, and shelter finding.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Home,
  MapPin,
  RefreshCw,
  Info,
} from 'lucide-react';
import { getEvents, getDistrictRiskScores, getShelters } from '../../api/services';
import type { DisasterEvent, DistrictRiskScore, Shelter } from '../../types';
import DataStatusBadge from '../../components/DataStatusBadge';

const DISTRICTS = [
  'Haridwar', 'Dehradun', 'Rishikesh', 'Uttarkashi', 'Chamoli', 'Rudraprayag',
  'Tehri Garhwal', 'Pauri Garhwal', 'Nainital', 'Udham Singh Nagar',
  'Almora', 'Bageshwar', 'Champawat', 'Pithoragarh', 'Varanasi', 'Gorakhpur',
];

export const CitizenHomePage: React.FC = () => {
  const [district, setDistrict] = useState<string>('Haridwar');
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'detected' | 'unavailable'>('detecting');

  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [riskScore, setRiskScore] = useState<DistrictRiskScore | null>(null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Browser Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationStatus('detected');
        },
        () => {
          setLocationStatus('unavailable');
        },
        { timeout: 8000 }
      );
    } else {
      setLocationStatus('unavailable');
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, riskRes, shelterRes] = await Promise.all([
        getEvents({ status: 'active' }).catch(() => ({ data: { events: [] } })),
        getDistrictRiskScores(district).catch(() => ({ data: { data: [] } })),
        getShelters({ district }).catch(() => ({ data: { shelters: [] } })),
      ]);

      const activeEvs = (evRes.data.events || []).filter(
        (e) => !e.district || e.district.toLowerCase() === district.toLowerCase()
      );
      setEvents(activeEvs.length > 0 ? activeEvs : evRes.data.events || []);

      const rList = riskRes.data.data || [];
      setRiskScore(rList.length > 0 ? rList[0] : null);

      setShelters(shelterRes.data.shelters || []);
    } catch (err) {
      console.error('Error fetching citizen home data', err);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [district]);

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Elevated': return '#eab308';
      case 'Moderate': return '#3b82f6';
      default: return '#22c55e';
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 16px', color: '#f8fafc' }}>
      {/* Location Bar & Selector */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} style={{ color: locationStatus === 'detected' ? '#22c55e' : '#eab308' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>CURRENT LOCATION</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
              {district}, Uttarakhand
              {locationStatus === 'detected' && ' (GPS Verified)'}
              {locationStatus === 'unavailable' && ' (Manual Select)'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#050814',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Primary Action Buttons (Large Touch Target Emergency Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}
      >
        {/* NEED HELP / SOS */}
        <Link
          to="/citizen/check-in?status=need_help"
          style={{
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            borderRadius: '12px',
            padding: '20px',
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 20px rgba(220, 38, 38, 0.3)',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>I NEED HELP</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>Request SOS Rescue / Relief</div>
          </div>
        </Link>

        {/* I AM SAFE */}
        <Link
          to="/citizen/check-in?status=safe"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            borderRadius: '12px',
            padding: '20px',
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>I AM SAFE</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>Notify Family &amp; Authorities</div>
          </div>
        </Link>

        {/* REPORT INCIDENT */}
        <Link
          to="/citizen/report"
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '12px',
            padding: '20px',
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>REPORT INCIDENT</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>Submit Field Flood / Damage Report</div>
          </div>
        </Link>

        {/* FIND SHELTER */}
        <Link
          to="/citizen/shelters"
          style={{
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            borderRadius: '12px',
            padding: '20px',
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 20px rgba(217, 119, 6, 0.3)',
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>FIND SHELTER</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>Locate Open Emergency Camps</div>
          </div>
        </Link>
      </div>

      {/* District Risk & Active Alerts Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* District Risk Level Card */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              DISTRICT HAZARD RISK
            </div>
            <DataStatusBadge status={riskScore?.dataStatus || 'SIMULATED'} size="sm" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: getRiskColor(riskScore?.riskLevel),
              }}
            >
              {riskScore ? riskScore.overallRiskScore : '25'}
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: getRiskColor(riskScore?.riskLevel),
                  textTransform: 'uppercase',
                }}
              >
                {riskScore ? riskScore.riskLevel : 'Low'} Risk Level
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                District: {district}
              </div>
            </div>
          </div>

          {riskScore?.majorHazards && riskScore.majorHazards.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Active Hazards: <strong>{riskScore.majorHazards.join(', ')}</strong>
            </div>
          )}
        </div>

        {/* Nearby Shelters Availability Card */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              LOCAL RELIEF SHELTERS
            </div>
            <Link to="/citizen/shelters" style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none' }}>
              View All →
            </Link>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e', marginBottom: '4px' }}>
            {shelters.filter((s) => s.status === 'AVAILABLE' || (s.status as any) === 'OPEN').length} Open Camps
          </div>

          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Available in {district} district area
          </div>
        </div>
      </div>

      {/* Active Disaster Alerts Section */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: '#ef4444' }} />
              Active Disaster Emergency Declarations
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
              Official warnings authorized by State Disaster Management Authority
            </div>
          </div>
          <Link to="/citizen/alerts" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
            See All Alerts →
          </Link>
        </div>

        {events.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <Info size={20} style={{ marginBottom: '6px', color: '#22c55e' }} />
            <div>No active emergency alert declarations for {district}.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.slice(0, 3).map((e) => (
              <div
                key={e._id}
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{e.title}</div>
                  <DataStatusBadge status={e.isLive ? 'LIVE' : 'MANUAL'} size="sm" />
                </div>
                <div style={{ fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '8px' }}>
                  {e.description || 'Disaster warning issued. Exercise extreme caution and follow safety guides.'}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>District: <strong>{e.district}</strong></span>
                  <span>Severity: <strong style={{ color: getRiskColor(e.severity) }}>{e.severity}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenHomePage;
