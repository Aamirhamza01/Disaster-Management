import { useEffect, useState } from 'react';
import { BookOpen, ShieldCheck, Flame, Waves, Activity, ThermometerSun, Wind, RefreshCw } from 'lucide-react';
import { getGuides } from '../../api/services';
import type { SafetyGuide } from '../../types';

export default function CitizenGuidesPage() {
  const [guides, setGuides] = useState<SafetyGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchSafetyGuides = async () => {
    setLoading(true);
    try {
      const res = await getGuides();
      if (res.data.success) {
        setGuides(res.data.guides || []);
      }
    } catch (err) {
      console.error('Failed to load safety guides:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyGuides();
  }, []);

  const getHazardIcon = (disasterType: string) => {
    switch (disasterType.toUpperCase()) {
      case 'FLOOD':
        return <Waves className="w-5 h-5 text-blue-400" />;
      case 'EARTHQUAKE':
        return <Activity className="w-5 h-5 text-amber-400" />;
      case 'HEATWAVE':
        return <ThermometerSun className="w-5 h-5 text-red-400" />;
      case 'CYCLONE':
        return <Wind className="w-5 h-5 text-teal-400" />;
      case 'FIRE':
        return <Flame className="w-5 h-5 text-orange-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
    }
  };

  const filteredGuides = guides.filter((g) => {
    if (selectedCategory === 'ALL') return true;
    return g.disasterType.toUpperCase() === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-400" />
              <h1 className="text-2xl font-bold text-slate-100">Disaster Preparedness & Safety Guides</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Actionable survival protocols, emergency checklists, and evacuation steps for diverse disaster hazards.
            </p>
          </div>

          <button
            onClick={fetchSafetyGuides}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition text-sm font-medium w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Protocols
          </button>
        </div>

        {/* Hazard Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
          {['ALL', 'FLOOD', 'EARTHQUAKE', 'LANDSLIDE', 'HEATWAVE', 'CYCLONE', 'FIRE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Cards */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading official safety manuals...</p>
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-200 font-semibold text-lg">No Guides Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
            No active safety guides found for this specific disaster category in the repository database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => (
            <div
              key={guide._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {getHazardIcon(guide.disasterType)}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {guide.disasterType}
                    </span>
                    <h2 className="text-lg font-bold text-slate-100 mt-1">{guide.title}</h2>
                  </div>
                </div>

                {/* Steps / Content */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Action Steps
                  </div>

                  {guide.steps && guide.steps.length > 0 ? (
                    <ol className="space-y-2 text-slate-300 text-sm list-decimal list-inside">
                      {guide.steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {typeof step === 'string' ? step : step.instruction}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {guide.summary || 'Follow standard civil defense directives during extreme weather events.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 flex justify-between items-center pt-2">
                <span>Language: {guide.language?.toUpperCase() || 'EN'}</span>
                <span>Verified SDMA Protocol</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
