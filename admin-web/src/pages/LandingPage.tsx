/**
 * LandingPage.tsx
 *
 * Platform entry point allowing users to choose between Public Citizen Portal
 * and Official SDMA Operator Command Center.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, Server, ChevronRight, Activity, Radio } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #0f172a, #020617)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center' }}>
        {/* Brand Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '1px',
            marginBottom: '20px',
          }}
        >
          <ShieldAlert size={16} />
          INDIA DISASTER MANAGEMENT &amp; AI EARLY WARNING PLATFORM
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 12px 0', lineHeight: 1.2 }}>
          RakṣāSetu Command &amp; Citizen Safety System
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '650px', margin: '0 auto 40px auto', lineHeight: 1.5 }}>
          Real-time AI hazard intelligence, automated broadcast dispatches, community distress check-ins, and post-disaster recovery tracking.
        </p>

        {/* Action Choice Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', textAlign: 'left' }}>
          {/* Public Citizen Portal Card */}
          <Link
            to="/citizen"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 30px -10px rgba(56, 189, 248, 0.2)',
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Users size={26} style={{ color: '#38bdf8' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>
                Citizen Public Portal
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                View active local disaster alerts, declare "I am Safe" or "Need Help", find nearest relief shelters, and report field incidents.
              </p>
            </div>

            <div
              style={{
                marginTop: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#38bdf8',
              }}
            >
              Enter Public Portal <ChevronRight size={18} />
            </div>
          </Link>

          {/* SDMA Operator Console Card */}
          <Link
            to="/dashboard"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 30px -10px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Server size={26} style={{ color: '#ef4444' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>
                Operator Command Console
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Authorized SDMA operators and emergency coordinators. Access district telemetry, AI hub, dispatches, simulation lab, and recovery.
              </p>
            </div>

            <div
              style={{
                marginTop: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#ef4444',
              }}
            >
              Open Command Center <ChevronRight size={18} />
            </div>
          </Link>
        </div>

        {/* Live system status footer note */}
        <div style={{ marginTop: '40px', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} style={{ color: '#22c55e' }} /> AI Engine: Active
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} style={{ color: '#60a5fa' }} /> OASIS CAP Alerts: Live
          </span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
