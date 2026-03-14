import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import { Bot, Zap } from 'lucide-react';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen">
          <header className="nav container">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', padding: '0.5rem', borderRadius: '12px' }}>
                <Bot color="white" size={24} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'white' }}>AI Content Engine</span>
            </Link>
            
            <nav style={{ display: 'flex', gap: '2.5rem' }}>
              <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
              <Link to="/blog" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Blog</Link>
            </nav>

            <a href="http://localhost:5173" className="btn-premium" style={{ fontSize: '0.9rem', padding: '0.75rem 1.5rem' }}>
              Entrar no Studio <Zap size={16} fill="white" />
            </a>
          </header>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>

          <footer style={{ padding: '80px 0 40px', borderTop: '1px solid var(--border-color)', marginTop: '80px' }}>
            <div className="container" style={{ textAlign: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                 <Bot size={20} color="var(--accent-primary)" />
                 <span style={{ fontWeight: 800, color: '#fff' }}>AI Content Engine</span>
               </div>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>© 2026 Todos os direitos reservados. Design by IA.</p>
            </div>
          </footer>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
