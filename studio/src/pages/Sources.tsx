import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ExternalLink, Clock, Target } from 'lucide-react';

export default function Sources() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSources() {
      // Buscar as últimas 50 notícias coletadas, mostrando primeiro as não processadas ou mais recentes
      const { data } = await supabase
         .from('content_sources')
         .select('*')
         .order('processed', { ascending: true }) // Não processadas primeiro
         .order('created_at', { ascending: false })
         .limit(50);
         
      if(data) setSources(data);
      setLoading(false);
    }
    loadSources();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1>Radar de Conteúdo (Feeds)</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Tudo o que o <strong>Trend Hunter</strong> encontrou na internet pelas suas palavras-chaves e RSS feeds.
      </p>

      {loading ? (
        <p className="text-muted">Carregando radares de inteligência...</p>
      ) : sources.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="text-muted">Nenhuma notícia coletada ainda.</p>
        </div>
      ) : (
        <div className="flex-column" style={{ gap: '1rem' }}>
          {sources.map(source => (
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
      )}
    </div>
  );
}
