import { useEffect, useState } from 'react';
import { ShieldAlert, MapPin, Clock, Filter, BookOpen, RefreshCw } from 'lucide-react';
import { getEvents } from '../../api/services';
import type { DisasterEvent } from '../../types';
import DataStatusBadge from '../../components/DataStatusBadge';

export default function CitizenAlertsPage() {
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');
  const [hazardFilter, setHazardFilter] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await getEvents({ status: 'active', limit: 50 });
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error('Failed to load active alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredEvents = events.filter(e => {
    if (districtFilter && e.district && e.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
    if (hazardFilter && e.type && e.type.toLowerCase() !== hazardFilter.toLowerCase()) return false;
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'EXTREME':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
      case 'SEVERE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
      case 'MODERATE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-red-400 animate-pulse" />
              <h1 className="text-2xl font-bold text-slate-100">Official Disaster Alerts</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Real-time emergency warnings and public safety advisories issued by response authorities.
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition font-medium text-sm w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Bulletins
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <input
            type="text"
            placeholder="Filter by district (e.g. Varanasi)"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Hazard Types</option>
            <option value="Flood">Flood</option>
            <option value="Earthquake">Earthquake</option>
            <option value="Landslide">Landslide</option>
            <option value="Heatwave">Heatwave</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Severe Weather">Severe Weather</option>
          </select>
        </div>
      </div>

      {/* Alert Feed */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Fetching active safety bulletins...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-200 font-semibold text-lg">No Active Warnings</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
            There are currently no active emergency alerts matching your criteria. Stay vigilant and verify local emergency guidance.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt._id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase border ${getSeverityBadge(evt.severity)}`}>
                      {evt.severity}
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                      {evt.type}
                    </span>
                    <DataStatusBadge status={evt.isLive ? 'LIVE' : 'EXTERNAL / OFFICIAL'} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-2">{evt.title}</h2>
                </div>

                <div className="text-right text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Issued: {new Date(evt.createdAt).toLocaleString()}</span>
                  </div>
                  {evt.updatedAt && evt.updatedAt !== evt.createdAt && (
                    <p className="text-slate-500">Updated: {new Date(evt.updatedAt).toLocaleTimeString()}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-300 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Affected Region: <strong>{evt.district || 'State-wide'}</strong>, {evt.state || 'India'}</span>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {evt.description}
              </p>

              {/* Safety Instructions */}
              <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wide mb-2">
                  <BookOpen className="w-4 h-4" /> Safety Guidance
                </div>
                <ul className="text-slate-300 text-sm space-y-1.5 list-disc list-inside">
                  <li>Follow instructions issued by local district authorities immediately.</li>
                  <li>Keep battery-powered emergency radios or charged mobile devices active.</li>
                  <li>Avoid flood waters, damaged structures, and downed power lines.</li>
                  <li>If asked to evacuate, proceed immediately to the nearest designated shelter.</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
