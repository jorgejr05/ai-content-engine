import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Clock, Target, Zap } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    sources: 0,
    insights: 0,
    posts: 0,
    communities: 0,
    research: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const [{ count: sCount }, { count: iCount }, { count: pCount }, { count: cCount }, { count: rCount }] = await Promise.all([
        supabase.from('content_sources').select('*', { count: 'exact', head: true }),
        supabase.from('content_insights').select('*', { count: 'exact', head: true }),
        supabase.from('generated_posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('community_discussions').select('*', { count: 'exact', head: true }),
        supabase.from('research_topics').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        sources: sCount || 0,
        insights: iCount || 0,
        posts: pCount || 0,
        communities: cCount || 0,
        research: rCount || 0
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem' }}>Visão Geral</h1>
        <p className="text-muted">Bem-vindo ao centro de comando da sua Inteligência de Mídia.</p>
      </header>

      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.6rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: 'var(--accent-color)' }}>
              <Target size={24} />
            </div>
            <span className="badge badge-purple">Radar Ativo</span>
          </div>
          <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fontes Monitoradas</p>
          <h2 style={{ fontSize: '3.5rem', margin: '0.5rem 0', fontWeight: 800 }}>{stats.sources + stats.communities}</h2>
          <div className="flex-between" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
             <span style={{ fontSize: '0.8rem' }} className="text-muted">{stats.sources} RSS Feeds</span>
             <span style={{ fontSize: '0.8rem' }} className="text-muted">{stats.communities} Reddit Communities</span>
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.6rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px', color: 'var(--accent-secondary)' }}>
              <Zap size={24} />
            </div>
            <span className="badge badge-blue">Cérebro IA</span>
          </div>
          <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insights Gerados</p>
          <h2 style={{ fontSize: '3.5rem', margin: '0.5rem 0', fontWeight: 800 }}>{stats.insights}</h2>
          <div className="flex-between" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
             <span style={{ fontSize: '0.8rem' }} className="text-muted">Tendências Identificadas</span>
             <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>+12% essa semana</span>
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.6rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: '#4ade80' }}>
              <Clock size={24} />
            </div>
            <span className="badge badge-green">Fila Flywheel</span>
          </div>
          <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conteúdos Pendentes</p>
          <h2 style={{ fontSize: '3.5rem', margin: '0.5rem 0', fontWeight: 800 }}>{stats.posts}</h2>
          <div className="flex-between" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
             <span style={{ fontSize: '0.8rem' }} className="text-muted">Drafts Prontos</span>
             <button className="btn-ghost" style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>Ver Fila</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, transparent 100%)' }}>
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
           <div>
             <h3 style={{ fontSize: '1.5rem' }}>Pipeline de Crescimento</h3>
             <p className="text-muted">Como sua máquina de conteúdo está operando hoje.</p>
           </div>
           <span className="badge badge-green" style={{ borderRadius: '8px' }}>Operação Nominal</span>
        </div>
        
        <div className="grid-3" style={{ gap: '1rem' }}>
           <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>01</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Trend Hunter</h4>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>O robô está varrendo RSS e Reddit em busca de padrões virais.</p>
           </div>
           <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-secondary)', marginBottom: '1rem' }}>02</div>
              <h4 style={{ marginBottom: '0.5rem' }}>IA Curating</h4>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Modelos Groq Llama 3 avaliam a relevância de cada sinal captado.</p>
           </div>
           <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: '#4ade80', marginBottom: '1rem' }}>03</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Flywheel Gen</h4>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Geração multiformato de posts e imagens para o seu ecossistema.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
