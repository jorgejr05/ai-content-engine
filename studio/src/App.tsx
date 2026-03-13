import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Target, Zap, FileText, Clock, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthProvider';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import Sources from './pages/Sources';
import Insights from './pages/Insights';
import Blog from './pages/Blog';
import AgentChat from './pages/AgentChat';
import Login from './pages/Login';

function App() {
  const { user, loading, signOut } = useAuth();

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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ marginBottom: '3rem', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Sparkles size={24} color="var(--accent-color)" />
            AI Studio
          </h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Content Engine</p>
        </div>

        <nav className="flex-column" style={{ gap: '0.5rem', flex: 1 }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <LayoutDashboard size={20} /> Visão Geral
          </NavLink>

          <NavLink
            to="/coletas"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <Target size={20} /> Radar de Coletas
          </NavLink>

          <NavLink
            to="/insights"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <Zap size={20} /> Insights de Ouro
          </NavLink>

          <NavLink
            to="/blog"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <FileText size={20} /> Acervo de Artigos
          </NavLink>

          <NavLink
            to="/posts"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <Clock size={20} /> Revisão de Posts
          </NavLink>

          <NavLink
            to="/agent"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <MessageSquare size={20} /> Falar com Agente
          </NavLink>
        </nav>

        {/* User info + Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>{user.email}</p>
          <button
            onClick={signOut}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.7rem 1rem', color: '#ef4444', fontSize: '0.85rem' }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/coletas" element={<Sources />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/agent" element={<AgentChat />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
