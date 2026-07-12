import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const themeMap = {
    success: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
    error:   { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', border: 'rgba(239,68,68,0.2)' },
    info:    { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
  };

  const icons = {
    success: <CheckCircle2 size={16} strokeWidth={2} />,
    error:   <AlertCircle size={16} strokeWidth={2} />,
    info:    <Info size={16} strokeWidth={2} />,
  };

  const t = themeMap[type];

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        borderRadius: 12,
        border: `1px solid ${t.border}`,
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-sec)',
        boxShadow: '0 8px 24px var(--color-shadow)',
        animation: 'modalIn 280ms cubic-bezier(0.16,1,0.3,1) both',
        minWidth: 260, maxWidth: 400,
      }}
    >
      <span style={{ color: t.color, flexShrink: 0 }}>{icons[type]}</span>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-mut)', padding: 3, display: 'flex', alignItems: 'center' }}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: { id: string; type: 'success' | 'error' | 'info'; message: string }[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8,
      maxWidth: 420, width: '100%', paddingRight: 4,
    }}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};
export default Toast;
