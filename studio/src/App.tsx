import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Target, Zap, FileText, Clock } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import Sources from './pages/Sources';
import Insights from './pages/Insights';
import Blog from './pages/Blog';

function App() {

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

        <nav className="flex-column" style={{ gap: '0.5rem' }}>
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <LayoutDashboard size={20} />
            Visão Geral
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
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/coletas" element={<Sources />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/posts" element={<Posts />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
