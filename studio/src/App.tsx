import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Newspaper, Sparkles, Send } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';

function App() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
          <Link 
            to="/" 
            className={`btn ${isActive('/') ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <LayoutDashboard size={18} />
            Visão Geral
          </Link>

          <Link 
            to="/coletas" 
            className={`btn ${isActive('/coletas') ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <Newspaper size={18} />
            Coletas (Scraper)
          </Link>

          <Link 
            to="/posts" 
            className={`btn ${isActive('/posts') ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}
          >
            <Send size={18} />
            Revisão de Posts
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/coletas" element={<div><h1>Coletas em Tempo Real</h1><p className="text-muted">Lista de itens importados não curados ainda virá aqui.</p></div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
