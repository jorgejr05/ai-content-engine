import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ExternalLink, Clock, Target } from 'lucide-react';

export default function Sources() {
  const [sources, setSources] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'community'>('news');

  useEffect(() => {
    async function loadData() {
      // Buscar notícias
      const { data: newsData } = await supabase
         .from('content_sources')
         .select('*')
         .order('processed', { ascending: true })
         .order('created_at', { ascending: false })
         .limit(50);
         
      // Buscar discussões
      const { data: communityData } = await supabase
         .from('community_discussions')
         .select('*')
         .order('processed', { ascending: true })
         .order('created_at', { ascending: false })
         .limit(50);

      if(newsData) setSources(newsData);
      if(communityData) setDiscussions(communityData);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1>Radar de Conteúdo (Radares)</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Acompanhe o que o <strong>Trend Hunter</strong> e o <strong>Social Listener</strong> estão encontrando.
      </p>

      <div className="flex-between" style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '12px', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'news' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ flex: 1 }}
            onClick={() => setActiveTab('news')}
          >
            Notícias (Feeds)
          </button>
          <button 
            className={`btn ${activeTab === 'community' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ flex: 1 }}
            onClick={() => setActiveTab('community')}
          >
            Comunidades (Reddit)
          </button>
      </div>

      {loading ? (
        <p className="text-muted">Sincronizando radares de inteligência...</p>
      ) : activeTab === 'news' ? (
        sources.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p className="text-muted">Nenhuma notícia coletada ainda.</p>
          </div>
        ) : (
          <div className="flex-column" style={{ gap: '1rem' }}>
            {sources.map(source => (
               // ... renderização existente
               <div key={source.id} className="card flex-column" style={{ padding: '1.5rem', borderLeft: source.processed ? '4px solid #34d399' : '4px solid #60a5fa' }}>
                  <div className="flex-between">
                     <span className={`badge ${source.processed ? 'badge-green' : 'badge-purple'}`}>
                         {source.processed ? 'Julgado pelo Groq' : 'Na fila de Curadoria'}
                     </span>
                     <div className="flex-between" style={{ gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                         <Clock size={14}/> 
                         {new Date(source.published_at || source.created_at).toLocaleDateString('pt-BR')}
                     </div>
                  </div>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <div className="flex-between" style={{ gap: '1rem', alignItems: 'flex-start' }}>
                       <h3 style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.4' }}>{source.title}</h3>
                       <a href={source.url} target="_blank" rel="noreferrer" className="btn btn-ghost" title="Ler Original">
                           <ExternalLink size={18} />
                       </a>
                    </div>
                    
                    <div className="flex-between" style={{ marginTop: '0.8rem', gap: '0.5rem', color: 'var(--text-muted)'}}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                           <Target size={14}/> Fonte: {source.source}
                       </div>
                    </div>
                  </div>
               </div>
            ))}
          </div>
        )
      ) : (
        discussions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p className="text-muted">Nenhuma discussão do Reddit detectada ainda.</p>
          </div>
        ) : (
          <div className="flex-column" style={{ gap: '1rem' }}>
            {discussions.map(item => (
              <div key={item.id} className="card flex-column" style={{ padding: '1.5rem', borderLeft: item.processed ? '4px solid #34d399' : '4px solid #f87171' }}>
                 <div className="flex-between">
                    <span className={`badge ${item.processed ? 'badge-green' : 'badge-purple'}`}>
                        {item.processed ? 'Problema Extraído' : 'Aguardando Análise'}
                    </span>
                    <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        🔥 Score: {item.score}
                    </div>
                 </div>
                 
                 <div style={{ marginTop: '1rem' }}>
                    <h3 style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.4' }}>{item.title}</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.content || 'Sem conteúdo de texto.'}
                    </p>
                    <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ marginTop: '1rem', padding: '0.5rem 0', fontSize: '0.85rem' }}>
                        Ver no Reddit <ExternalLink size={14} />
                    </a>
                 </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
