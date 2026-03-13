import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  Bell, LayoutDashboard, Sparkles, Target, Zap, FileText, 
  Clock, MessageSquare, LogOut, Menu, X, Trash2 
} from 'lucide-react';
import { useAuth } from './contexts/AuthProvider';
import { useNotifications } from './contexts/NotificationContext';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import Sources from './pages/Sources';
import Insights from './pages/Insights';
import Blog from './pages/Blog';
import AgentChat from './pages/AgentChat';
import Profile from './pages/Profile';
import Login from './pages/Login';

function App() {
  const { user, loading, signOut } = useAuth();
  const { notifications, markAsRead, clearAll } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={40} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
          <p className="text-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário';

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Sparkles size={20} color="var(--accent-color)" />
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Studio</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <button onClick={() => setIsNotifOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-dot" />}
           </button>
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
           >
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>
      </div>

      {/* Notification Sidebar */}
      <aside className={`notification-sidebar ${isNotifOpen ? 'open' : ''}`}>
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={20} color="var(--accent-color)" /> Avisos
          </h3>
          <button onClick={() => setIsNotifOpen(false)} className="btn-ghost" style={{ padding: '0.4rem' }}><X size={20} /></button>
        </div>

        <div className="flex-column" style={{ gap: '1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 12rem)', scrollbarWidth: 'none' }}>
           {notifications.length === 0 ? (
             <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.3 }}>
                <Bell size={48} style={{ marginBottom: '1rem' }} />
                <p className="text-muted">Nenhum aviso no momento.</p>
             </div>
           ) : (
             notifications.map(n => (
               <div 
                 key={n.id} 
                 onClick={() => markAsRead(n.id)}
                 style={{ 
                   padding: '1rem', borderRadius: '12px', background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(139, 92, 246, 0.05)', 
                   border: '1px solid', borderColor: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.2)', cursor: 'pointer',
                   transition: 'var(--transition)'
                 }}
               >
                 <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.type === 'success' ? '#22c55e' : n.type === 'error' ? '#ef4444' : '#8b5cf6', marginTop: '4px' }} />
                    <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                 </div>
                 <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '1.3rem' }}>{n.timestamp.toLocaleTimeString()}</span>
               </div>
             ))
           )}
        </div>

        {notifications.length > 0 && (
          <button onClick={clearAll} className="btn-ghost" style={{ width: '100%', marginTop: '2rem', fontSize: '0.8rem', gap: '0.5rem' }}>
            <Trash2 size={14} /> Limpar tudo
          </button>
        )}
      </aside>

      {/* Mobile/Notif Overlay */}
      {(isMobileMenuOpen || isNotifOpen) && (
        <div 
          onClick={() => { setIsMobileMenuOpen(false); setIsNotifOpen(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(4px)', zIndex: 45
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '12px', 
                background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px -4px var(--accent-glow)'
              }}>
                <Sparkles size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Studio</h2>
                <span className="badge badge-purple" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>Media Engine</span>
              </div>
            </div>
            
            <button onClick={() => setIsNotifOpen(true)} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '10px', position: 'relative' }}>
               <Bell size={18} />
               {unreadCount > 0 && <span className="notification-dot" style={{ top: '6px', right: '6px' }} />}
            </button>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem', paddingLeft: '1rem' }}>
              Inteligência
            </p>
            <div className="flex-column" style={{ gap: '0.3rem' }}>
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> Visão Geral
              </NavLink>

              <NavLink to="/agent" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <MessageSquare size={18} /> Agente IA
              </NavLink>

              <NavLink to="/insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Zap size={18} /> Insights
              </NavLink>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem', paddingLeft: '1rem' }}>
              Diretório
            </p>
            <div className="flex-column" style={{ gap: '0.3rem' }}>
              <NavLink to="/blog" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={18} /> Acervo Blog
              </NavLink>

              <NavLink to="/posts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Clock size={18} /> Flywheel Feed
              </NavLink>
              
              <NavLink to="/coletas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Target size={18} /> Radar News
              </NavLink>
            </div>
          </div>
        </nav>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginBottom: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Configurações</p>
            </div>
          </NavLink>

          <button onClick={signOut} className="btn-ghost" style={{
            width: '100%', justifyContent: 'flex-start', padding: '0.7rem 1rem',
            color: 'rgba(239,68,68,0.8)', fontSize: '0.8rem', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}>
            <LogOut size={16} /> Sair do Studio
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/coletas" element={<Sources />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/agent" element={<AgentChat />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
