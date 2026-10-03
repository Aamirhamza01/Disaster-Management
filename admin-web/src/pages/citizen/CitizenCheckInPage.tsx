import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, HeartHandshake, MapPin, CheckCircle2, UserCheck, ArrowLeft } from 'lucide-react';
import { submitCheckIn, registerCitizenUser } from '../../api/services';

export default function CitizenCheckInPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as 'safe' | 'need_help' | 'family_safe') || 'safe';

  const [status, setStatus] = useState<'safe' | 'need_help' | 'family_safe'>(initialStatus);
  const [name, setName] = useState(localStorage.getItem('citizen_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('citizen_phone') || '');
  const [district, setDistrict] = useState('Varanasi');
  const [state, setState] = useState('Uttar Pradesh');
  const [peopleCount, setPeopleCount] = useState(1);
  const [message, setMessage] = useState('');

  const [coords, setCoords] = useState<[number, number]>([82.9739, 25.3176]); // default Varanasi
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'detected' | 'unavailable'>('detecting');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.longitude, pos.coords.latitude]);
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

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const activeName = name.trim() || 'Citizen User';
    const activePhone = phone.trim() || '+919999999999';

    localStorage.setItem('citizen_name', activeName);
    localStorage.setItem('citizen_phone', activePhone);

    try {
      // Step 1: Ensure user is registered on backend to get userId
      let userId = localStorage.getItem('citizen_user_id');
      if (!userId) {
        const regRes = await registerCitizenUser({
          name: activeName,
          phone: activePhone,
        });
        if (regRes.data.success && regRes.data.userId) {
          userId = regRes.data.userId;
          localStorage.setItem('citizen_user_id', userId);
        } else {
          throw new Error('Registration failed');
        }
      }

      // Step 2: Submit check-in
      const res = await submitCheckIn({
        userId,
        status,
        coordinates: coords,
        district,
        state,
        peopleCount: Number(peopleCount) || 1,
        message: message.trim() || undefined,
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Status recorded successfully.');
      } else {
        setErrorMsg('Failed to process check-in status.');
      }
    } catch (err: any) {
      console.error('Check-in failed:', err);
      // Fallback: If user registration failed, re-try with new random phone
      setErrorMsg(err?.response?.data?.message || 'Error processing status check-in. Please ensure name and phone are valid.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <Link to="/citizen" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Citizen Home
        </Link>
        <div className="flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-emerald-400" />
          <h1 className="text-2xl font-bold text-slate-100">Citizen Safety Check-In</h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Broadcast your safety status or trigger an SOS request to emergency response teams.
        </p>
      </div>

      {successMsg ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-100">Check-In Confirmed</h2>
            <p className="text-slate-300 text-base mt-2">{successMsg}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1 text-left">
            <div><strong>Recorded Status:</strong> <span className="uppercase font-bold text-emerald-400">{status}</span></div>
            <div><strong>Location:</strong> {district}, {state}</div>
            <div><strong>People Count:</strong> {peopleCount}</div>
            <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => setSuccessMsg(null)}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition"
            >
              Submit Update
            </button>
            <Link
              to="/citizen"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition"
            >
              Done
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCheckIn} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Large Action Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Select Your Status *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStatus('safe')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition ${
                  status === 'safe'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
                <span className="font-bold text-sm">I AM SAFE</span>
                <span className="text-[11px] text-slate-400">Mark yourself safe</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('need_help')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition ${
                  status === 'need_help'
                    ? 'bg-red-950/60 border-red-500 text-red-300 ring-2 ring-red-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertCircle className="w-7 h-7 text-red-400 animate-pulse" />
                <span className="font-bold text-sm text-red-400">NEED HELP (SOS)</span>
                <span className="text-[11px] text-slate-400">Request immediate response</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('family_safe')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition ${
                  status === 'family_safe'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-300 ring-2 ring-blue-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <HeartHandshake className="w-7 h-7 text-blue-400" />
                <span className="font-bold text-sm">FAMILY SAFE</span>
                <span className="text-[11px] text-slate-400">Household is safe</span>
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                placeholder="e.g. +919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Location & Group Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                District *
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                State *
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                People Count
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={peopleCount}
                onChange={(e) => setPeopleCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Message / Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Optional Message / Emergency Notes
            </label>
            <textarea
              rows={3}
              placeholder={status === 'need_help' ? 'Specify immediate rescue or medical requirements...' : 'Any additional comments...'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Location telemetry note */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {locationStatus === 'detected'
                ? 'Device GPS coordinates will be attached automatically.'
                : 'GPS position unavailable. District location will be logged.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 font-bold rounded-xl transition flex items-center justify-center gap-2 text-base ${
              status === 'need_help'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : status === 'need_help' ? (
              <>TRANSMIT EMERGENCY SOS NOW</>
            ) : (
              <>SUBMIT SAFETY CHECK-IN</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
