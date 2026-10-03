import React, { useState, useEffect } from 'react';
import { AlertCircle, MapPin, CheckCircle2, Send, Navigation, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { submitIncident } from '../../api/services';

export default function CitizenIncidentReportPage() {
  const [formData, setFormData] = useState({
    citizenName: localStorage.getItem('citizen_name') || '',
    citizenPhone: localStorage.getItem('citizen_phone') || '',
    incidentType: 'Flood',
    title: '',
    description: '',
    severity: 'MEDIUM',
    peopleAffected: 1,
    district: 'Varanasi',
    state: 'Uttar Pradesh',
  });

  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'unavailable'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords([position.coords.longitude, position.coords.latitude]);
        setLocationStatus('detected');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationStatus('unavailable');
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setErrorMsg('Please fill in both the title and detailed description.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    // Save name & phone for future sessions
    if (formData.citizenName) localStorage.setItem('citizen_name', formData.citizenName);
    if (formData.citizenPhone) localStorage.setItem('citizen_phone', formData.citizenPhone);

    try {
      const payload: any = {
        citizenName: formData.citizenName || 'Anonymous Citizen',
        citizenPhone: formData.citizenPhone || undefined,
        incidentType: formData.incidentType,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        peopleAffected: Number(formData.peopleAffected) || 1,
        district: formData.district,
        state: formData.state,
      };

      if (coords) {
        payload.location = {
          type: 'Point',
          coordinates: coords,
        };
      }

      const res = await submitIncident(payload);
      if (res.data.success && res.data.report?._id) {
        setSubmittedId(res.data.report._id);
      } else {
        setErrorMsg('Failed to submit incident report. Please try again.');
      }
    } catch (err: any) {
      console.error('Incident report submission error:', err);
      setErrorMsg(err?.response?.data?.message || 'Error submitting report. Please check your internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-100">Incident Submitted Successfully</h1>
            <p className="text-slate-400 text-sm mt-2">
              Your report has been logged and transmitted to emergency dispatch operators.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reference ID</div>
            <div className="font-mono text-emerald-400 font-bold text-lg select-all">{submittedId}</div>
            <p className="text-xs text-slate-400 pt-1">
              Please preserve this reference ID for status updates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setSubmittedId(null);
                setFormData(prev => ({ ...prev, title: '', description: '' }));
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition"
            >
              Report Another Incident
            </button>

            <Link
              to="/citizen"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition text-center"
            >
              Return to Citizen Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <Link to="/citizen" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Citizen Home
        </Link>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl font-bold text-slate-100">Report Emergency Incident</h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Submit crucial hazard observations or local emergency hazards directly to response coordinators.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Location Status Indicator */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location Status</div>
              <div className="text-sm font-medium text-slate-200">
                {locationStatus === 'detecting' && <span className="text-amber-400">Detecting GPS location...</span>}
                {locationStatus === 'detected' && <span className="text-emerald-400">Location detected via GPS</span>}
                {locationStatus === 'unavailable' && <span className="text-slate-400">Location access unavailable (Manual selection active)</span>}
                {locationStatus === 'idle' && <span className="text-slate-400">Location not checked</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={requestLocation}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Refresh GPS
          </button>
        </div>

        {/* Contact Info (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Your Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={formData.citizenName}
              onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={formData.citizenPhone}
              onChange={(e) => setFormData({ ...formData, citizenPhone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Hazard Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Incident Type *
            </label>
            <select
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Flood">Flood</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Landslide">Landslide</option>
              <option value="Fire">Fire / Wildfire</option>
              <option value="Structural Damage">Structural Damage</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Power Outage">Power Outage</option>
              <option value="Road Blockade">Road Blockade</option>
              <option value="Other">Other Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Urgency / Severity *
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="LOW">LOW — Minor inconvenience</option>
              <option value="MEDIUM">MEDIUM — Moderate concern</option>
              <option value="HIGH">HIGH — Urgent threat</option>
              <option value="CRITICAL">CRITICAL — Life Safety Risk</option>
            </select>
          </div>
        </div>

        {/* District & People Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              District *
            </label>
            <input
              type="text"
              placeholder="District name"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Estimated People Affected
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={formData.peopleAffected}
              onChange={(e) => setFormData({ ...formData, peopleAffected: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Incident Headline / Title *
          </label>
          <input
            type="text"
            placeholder="e.g. Water logging blocking main bypass road near Central Market"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Detailed Description *
          </label>
          <textarea
            rows={4}
            placeholder="Describe the situation, landmarks, immediate needs, or trapped individuals..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
            required
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 text-base"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting Report...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" /> Submit Incident Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
