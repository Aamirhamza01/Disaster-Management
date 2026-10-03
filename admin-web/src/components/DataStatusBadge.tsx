import React from 'react';
import { Activity, ShieldCheck, Cpu, Edit3 } from 'lucide-react';

export type DataStatus = 'LIVE' | 'EXTERNAL / OFFICIAL' | 'EXTERNAL_OFFICIAL' | 'SIMULATED' | 'MANUAL';

interface DataStatusBadgeProps {
  status: DataStatus | string;
  size?: 'sm' | 'md';
}

/**
 * Reusable Data Provenance Badge
 * Clearly differentiates LIVE government telemetry, EXTERNAL / OFFICIAL agency feeds,
 * SIMULATED AI/demo data, and MANUAL operator entries.
 */
export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = status.toUpperCase().trim();

  let label = status;
  let bg = '#f1f5f9';
  let color = '#475569';
  let border = '#cbd5e1';
  let icon = <Cpu size={size === 'sm' ? 12 : 14} />;

  if (normalized === 'LIVE') {
    label = 'LIVE';
    bg = '#ecfdf5';
    color = '#065f46';
    border = '#6ee7b7';
    icon = <Activity size={size === 'sm' ? 12 : 14} className="pulse-dot" />;
  } else if (normalized === 'EXTERNAL / OFFICIAL' || normalized === 'EXTERNAL_OFFICIAL' || normalized === 'OFFICIAL') {
    label = 'EXTERNAL / OFFICIAL';
    bg = '#eff6ff';
    color = '#1e40af';
    border = '#93c5fd';
    icon = <ShieldCheck size={size === 'sm' ? 12 : 14} />;
  } else if (normalized === 'SIMULATED') {
    label = 'SIMULATED';
    bg = '#fffbeb';
    color = '#92400e';
    border = '#fcd34d';
    icon = <Cpu size={size === 'sm' ? 12 : 14} />;
  } else if (normalized === 'MANUAL') {
    label = 'MANUAL';
    bg = '#faf5ff';
    color = '#6b21a8';
    border = '#d8b4fe';
    icon = <Edit3 size={size === 'sm' ? 12 : 14} />;
  }

  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '10px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}
      title={`Data Provenance: ${label}`}
    >
      {icon}
      {label}
    </span>
  );
};

export default DataStatusBadge;
