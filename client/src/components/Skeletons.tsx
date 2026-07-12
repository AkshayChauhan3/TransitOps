import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div
    className="skeleton"
    style={{
      borderRadius: 16,
      padding: '20px',
      border: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: 130,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ height: 10, width: 80, backgroundColor: 'var(--color-surface-2)', borderRadius: 6 }} />
      <div style={{ height: 30, width: 30, backgroundColor: 'var(--color-surface-2)', borderRadius: 8 }} />
    </div>
    <div style={{ height: 32, width: 56, backgroundColor: 'var(--color-surface-2)', borderRadius: 6 }} />
    <div style={{ height: 10, width: 140, backgroundColor: 'var(--color-surface-2)', borderRadius: 6 }} />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div
    className="skeleton"
    style={{
      borderRadius: 16,
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}
  >
    <div style={{ padding: '14px 20px', backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ height: 10, width: 100, backgroundColor: 'var(--color-surface)', borderRadius: 6 }} />
      <div style={{ height: 10, width: 140, backgroundColor: 'var(--color-surface)', borderRadius: 6 }} />
    </div>
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: i < rows - 1 ? '1px solid var(--color-border)' : 'none' }}>
          <div style={{ height: 10, width: 10, backgroundColor: 'var(--color-surface-2)', borderRadius: 4, flexShrink: 0 }} />
          <div style={{ height: 10, flex: 1, backgroundColor: 'var(--color-surface-2)', borderRadius: 6 }} />
          <div style={{ height: 10, width: 60, backgroundColor: 'var(--color-surface-2)', borderRadius: 6 }} />
          <div style={{ height: 10, width: 40, backgroundColor: 'var(--color-surface-2)', borderRadius: 6 }} />
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div
    className="skeleton"
    style={{
      borderRadius: 16,
      border: '1px solid var(--color-border)',
      padding: '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}
  >
    <div style={{ height: 14, width: 140, backgroundColor: 'var(--color-surface-2)', borderRadius: 6 }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 9, width: 60, backgroundColor: 'var(--color-surface-2)', borderRadius: 5 }} />
          <div style={{ height: 36, width: '100%', backgroundColor: 'var(--color-surface-2)', borderRadius: 9 }} />
        </div>
      ))}
    </div>
    <div style={{ height: 36, width: 120, backgroundColor: 'var(--color-surface-2)', borderRadius: 9, marginLeft: 'auto' }} />
  </div>
);

export default CardSkeleton;
