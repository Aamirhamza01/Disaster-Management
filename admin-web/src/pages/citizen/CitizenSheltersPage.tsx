import { useEffect, useState } from 'react';
import { Home, MapPin, Users, Filter, Navigation, RefreshCw, CheckCircle } from 'lucide-react';
import { getShelters } from '../../api/services';
import type { Shelter } from '../../types';

export default function CitizenSheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const res = await getShelters();
      if (res.data.success) {
        setShelters(res.data.shelters || []);
      }
    } catch (err) {
      console.error('Failed to load shelters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords([pos.coords.longitude, pos.coords.latitude]),
        () => console.log('Location permission denied for shelter sorting')
      );
    }
  }, []);

  // Distance calculator (Haversine formula in KM)
  const calculateDistanceKm = (shelterCoords?: [number, number]) => {
    if (!userCoords || !shelterCoords || shelterCoords.length < 2) return null;
    const [lon1, lat1] = userCoords;
    const [lon2, lat2] = shelterCoords;

    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const processedShelters = shelters
    .filter((s) => {
      if (districtFilter && s.district && s.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    })
    .map((s) => {
      const dist = s.location?.coordinates ? calculateDistanceKm(s.location.coordinates) : null;
      return { ...s, distanceKm: dist ? parseFloat(dist) : Infinity };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Home className="w-7 h-7 text-emerald-400" />
              <h1 className="text-2xl font-bold text-slate-100">Designated Emergency Shelters</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Find nearest relief camps, safe havens, capacity levels, and available facilities.
            </p>
          </div>

          <button
            onClick={fetchShelters}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition text-sm font-medium w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Shelter Data
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE — Operational</option>
            <option value="NEAR_CAPACITY">NEAR CAPACITY</option>
            <option value="FULL">FULL — At Capacity</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          {userCoords && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-medium ml-auto">
              <Navigation className="w-3.5 h-3.5" /> Nearest shelters sorted first
            </div>
          )}
        </div>
      </div>

      {/* Shelter Grid */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading emergency shelter registry...</p>
        </div>
      ) : processedShelters.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <Home className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-200 font-semibold text-lg">No Shelters Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
            No shelters matched your district or status filters. Try clearing filters or contacting emergency helpline numbers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedShelters.map((s) => {
            const occPct = s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0;
            const distance = s.distanceKm !== Infinity ? `${s.distanceKm} km away` : null;

            return (
              <div
                key={s._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {s.district}, {s.address || 'Address not specified'}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${
                        s.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : s.status === 'FULL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  {distance && (
                    <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-md mb-3">
                      <Navigation className="w-3 h-3" /> {distance}
                    </div>
                  )}

                  {/* Occupancy Meter */}
                  <div className="space-y-1.5 my-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> Occupancy Level
                      </span>
                      <span className="font-semibold">{s.currentOccupancy} / {s.capacity} ({occPct}%)</span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occPct >= 90
                            ? 'bg-red-500'
                            : occPct >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(occPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Facilities */}
                  {s.facilities && s.facilities.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Facilities</div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.facilities.map((f, i) => (
                          <span
                            key={i}
                            className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-400" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {s.contactNumber ? (
                  <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
                    <span>Contact Officer</span>
                    <span className="font-semibold text-slate-300">{s.contactNumber}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
