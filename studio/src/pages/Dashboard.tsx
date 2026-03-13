import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Activity, Database, Clock, Target, Zap } from 'lucide-react';

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
      <h1>Dashboard Central</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Acompanhe o fluxo da sua máquina de conteúdo.</p>

      <div className="grid-3">
        <div className="card">
          <div className="flex-between">
            <span className="text-muted">Radares Ativos</span>
            <Target className="text-purple" size={20} />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{stats.sources + stats.communities}</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>{stats.sources} RSS + {stats.communities} Reddit</p>
        </div>

        <div className="card">
          <div className="flex-between">
            <span className="text-muted">Cérebro IA</span>
            <Zap className="text-purple" size={20} />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{stats.insights}</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>{stats.research} Pesquisas Ativas</p>
        </div>

        <div className="card">
          <div className="flex-between">
            <span className="text-muted">Fila Flywheel</span>
            <Clock className="text-purple" size={20} />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{stats.posts}</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Formatos Multimídia Pendentes</p>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
           <h3>Pipeline de Execução</h3>
           <span className="badge badge-green">Online</span>
        </div>
        <div className="flex-column" style={{ gap: '1rem' }}>
           <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)' }}>
              <h4>1. Trend Hunter</h4>
              <p className="text-muted">Busca autônoma de fontes RSS.</p>
           </div>
           <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)' }}>
              <h4>2. Curadoria (Groq LLM)</h4>
              <p className="text-muted">Avaliação, notas e descarte do lixo digital.</p>
           </div>
           <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)' }}>
              <h4>3. Geração de Conteúdo</h4>
              <p className="text-muted">Drafts de posts otimizados para cada persona.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
