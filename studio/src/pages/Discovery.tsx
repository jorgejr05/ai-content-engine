import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { 
  Database, Lightbulb, ExternalLink, Zap, 
  Search, Calendar, BarChart2 
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function Discovery() {
  const [activeTab, setActiveTab] = useState<'sources' | 'insights'>('sources');
  const [sources, setSources] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sData } = await supabase
        .from('content_sources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: iData } = await supabase
        .from('content_insights')
        .select('*, content_sources(title)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (sData) setSources(sData);
      if (iData) setInsights(iData);
    } catch (e) {
      addNotification('error', 'Erro ao carregar dados de descoberta.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateFromSource = (title: string) => {
    // Salva o contexto no localStorage ou passa via state para o chat
    localStorage.setItem('pending_generation_topic', title);
    addNotification('info', `Direcionando para o Agente para gerar post sobre: ${title}`);
    navigate('/agent');
  };

  const filteredSources = sources.filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInsights = insights.filter(i => 
    i.business_insight?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.content_sources?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in discovery-container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Trend Discovery</h1>
          <p className="text-muted">Explore as fontes varridas e os insights gerados pela inteligência curadora.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-bar" style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input 
                    className="input" 
                    placeholder="Filtrar por tema..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem', width: '250px' }}
                />
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setActiveTab('sources')}
                className={`btn ${activeTab === 'sources' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: '10px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                <Database size={14} style={{ marginRight: '0.5rem' }} /> Fontes
              </button>
              <button 
                onClick={() => setActiveTab('insights')}
                className={`btn ${activeTab === 'insights' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: '10px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                <Lightbulb size={14} style={{ marginRight: '0.5rem' }} /> Insights
              </button>
            </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
            <Zap className="animate-pulse" size={40} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
            <p className="text-muted">Carregando tendências...</p>
        </div>
      ) : (
        <div className="discovery-grid">
          {activeTab === 'sources' ? (
            <div className="discovery-list flex-column" style={{ gap: '1rem' }}>
              {filteredSources.map(source => (
                <div key={source.id} className="card flex-between animate-slide-up" style={{ padding: '1.25rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{source.source.toUpperCase()}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> {new Date(source.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{source.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a href={source.url} target="_blank" rel="noreferrer" className="btn btn-ghost" title="Ver original">
                      <ExternalLink size={18} />
                    </a>
                    <button className="btn btn-primary" onClick={() => handleGenerateFromSource(source.title)} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                      <Zap size={14} /> Gerar Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="discovery-list flex-column" style={{ gap: '1.5rem' }}>
              {filteredInsights.map(insight => (
                <div key={insight.id} className="card animate-slide-up" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={16} color="var(--accent-color)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-color)' }}>INSIGHT IA</span>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(insight.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '1rem', color: '#fff', lineHeight: '1.6', marginBottom: '1.5rem' }}>{insight.business_insight}</p>
                  <div className="flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Origem: <span style={{ color: '#fff' }}>{insight.content_sources?.title || 'Fonte externa'}</span>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleGenerateFromSource(insight.business_insight)} style={{ fontSize: '0.8rem' }}>
                      <Zap size={14} /> Usar Insight
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
