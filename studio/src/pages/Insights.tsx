import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { BrainCircuit, ExternalLink, Trophy } from 'lucide-react';

export default function Insights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      // Buscar os últimos 50 insights aprovados com os dados da fonte primária (notícia)
      const { data } = await supabase
         .from('content_insights')
         .select('*, content_sources(title, url, source)')
         .order('created_at', { ascending: false })
         .limit(50);
         
      if(data) setInsights(data);
      setLoading(false);
    }
    loadInsights();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1>Centro de Inteligência Ouro</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        As melhores notícias filtradas e transformadas em <strong>Insights Acionáveis para PMEs</strong> pelo Agente Curador (Groq).
      </p>

      {loading ? (
        <p className="text-muted">Acessando banco de cérebros...</p>
      ) : insights.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="text-muted">A IA ainda não julgou materiais valiosos (Score &gt; 7).</p>
        </div>
      ) : (
        <div className="flex-column" style={{ gap: '1.5rem' }}>
          {insights.map(insight => (
            <div key={insight.id} className="card" style={{ borderLeft: '4px solid #fbbf24' }}>
               
               <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 'bold' }}>
                      <Trophy size={18} />
                      Score de Relevância: {insight.score}/10
                  </div>
                  <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <BrainCircuit size={14}/> Insight Gerado
                  </span>
               </div>
               
               <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.5rem'}}>Notícia Base: </h4>
               <a href={insight.content_sources?.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#60a5fa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                    {insight.content_sources?.title} <ExternalLink size={14}/>
               </a>

               <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Insight Acionável (PMEs):</h4>
                  <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>{insight.business_insight}</p>
               </div>
               
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
