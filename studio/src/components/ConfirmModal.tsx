import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary';
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'primary'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }} 
      />
      
      {/* Modal Card */}
      <div className="animate-scale-in" style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '450px', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '24px', 
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>{message}</p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-ghost" 
            onClick={onClose}
            style={{ flex: 1, borderRadius: '12px' }}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            onClick={() => { onConfirm(); onClose(); }}
            style={{ 
                flex: 1, 
                borderRadius: '12px',
                background: type === 'danger' ? '#ef4444' : 'var(--accent-color)',
                boxShadow: type === 'danger' ? '0 8px 16px -4px rgba(239, 68, 68, 0.4)' : '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
