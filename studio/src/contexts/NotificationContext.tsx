import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Mantém as últimas 50
    setToasts(prev => [...prev, newNotif]);

    // Remove toast após 4 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 4000);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll }}>
      {children}
      
      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.8rem', pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`} style={{ pointerEvents: 'auto' }}>
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex', opacity: 0.6 }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
