import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Activity, Database, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSources: 0,
    insightsGenerated: 0,
    pendingPosts: 0
  });

  useEffect(() => {
    async function loadStats() {
      const { count: c1 } = await supabase.from('content_sources').select('*', { count: 'exact', head: true });
      const { count: c2 } = await supabase.from('content_insights').select('*', { count: 'exact', head: true });
      const { count: c3 } = await supabase.from('generated_posts').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      setStats({
        totalSources: c1 || 0,
        insightsGenerated: c2 || 0,
        pendingPosts: c3 || 0
      });
    }
    loadStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1>Dashboard Central</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Acompanhe o fluxo da sua máquina de conteúdo.</p>

      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div className="card">
          <div className="flex-between">
            <h3 className="text-muted">Notícias Coletadas</h3>
            <Database size={20} color="var(--accent-color)" />
          </div>
          <h2 style={{ fontSize: '2.5rem', marginTop: '1rem' }}>{stats.totalSources}</h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Pelo Scraper</p>
        </div>

        <div className="card">
          <div className="flex-between">
            <h3 className="text-muted">Insights (Alto Valor)</h3>
            <Activity size={20} color="#34d399" />
          </div>
          <h2 style={{ fontSize: '2.5rem', marginTop: '1rem' }}>{stats.insightsGenerated}</h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Aprovados pelo Groq (Score &gt; 7)</p>
        </div>

        <div className="card">
          <div className="flex-between">
            <h3 className="text-muted">Posts na Fila</h3>
            <Clock size={20} color="#fbbf24" />
          </div>
          <h2 style={{ fontSize: '2.5rem', marginTop: '1rem' }}>{stats.pendingPosts}</h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Aguardando aprovação</p>
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
