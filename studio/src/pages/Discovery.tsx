import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { 
  Database, Lightbulb, ExternalLink, Zap, 
  Search, Calendar, BarChart2, RefreshCcw 
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
      const { data: sData, error: sError } = await supabase
        .from('content_sources')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);
      
      const { data: iData, error: iError } = await supabase
        .from('content_insights')
        .select('*, content_sources(title)')
        .limit(100);

      if (sError) throw sError;
      if (iError) throw iError;

      setSources(sData || []);
      setInsights(iData || []);
    } catch (e: any) {
      console.error('Fetch error:', e);
      addNotification('error', `Erro ao sincronizar dados: ${e.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateFromSource = (title: string) => {
    localStorage.setItem('pending_generation_topic', title);
    addNotification('info', `Direcionando para o Agente para gerar post sobre: ${title}`);
    navigate('/agent');
  };

  const filteredSources = sources.filter(s => 
    (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.source || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInsights = insights.filter(i => 
    (i.business_insight || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.content_sources?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in discovery-container" style={{ paddingBottom: '4rem' }}>
      <div className="flex-between" style={{ marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Trend Discovery</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Sincronização em tempo real com radares de IA e fontes globais.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={fetchData} 
              className={`btn ${loading ? 'btn-ghost' : 'btn-primary'}`}
              style={{ 
                padding: '0.8rem 1.2rem', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem',
                fontSize: '0.85rem'
              }}
              disabled={loading}
              title="Sincronizar com o banco"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Sincronizando...' : 'Sincronizar'}
            </button>

            {/* Search Bar Premium */}
            <div style={{ position: 'relative', width: '320px' }}>
                <Search size={18} style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--accent-color)',
                    opacity: 0.7 
                }} />
                <input 
                    className="input" 
                    placeholder="Filtrar por tema ou nicho..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ 
                        padding: '1.2rem 1.2rem 1.2rem 3.5rem', 
                        width: '100%',
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onFocus={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.06)';
                        e.target.style.borderColor = 'var(--accent-color)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.15)';
                    }}
                    onBlur={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.03)';
                        e.target.style.borderColor = 'var(--border-color)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                />
            </div>

            {/* Tab Switcher Premium */}
            <div style={{ 
                display: 'flex', 
                background: 'rgba(255,255,255,0.03)', 
                padding: '0.5rem', 
                borderRadius: '16px', 
                border: '1px solid var(--border-color)',
                backdropFilter: 'blur(10px)'
            }}>
              <button 
                onClick={() => setActiveTab('sources')}
                className={`btn ${activeTab === 'sources' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: '12px', fontSize: '0.85rem', padding: '0.6rem 1.2rem', gap: '0.6rem' }}
              >
                <Database size={16} /> Fontes
              </button>
              <button 
                onClick={() => setActiveTab('insights')}
                className={`btn ${activeTab === 'insights' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: '12px', fontSize: '0.85rem', padding: '0.6rem 1.2rem', gap: '0.6rem' }}
              >
                <Lightbulb size={16} /> Insights
              </button>
            </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '8rem 0' }}>
            <Zap className="animate-pulse" size={48} color="var(--accent-color)" style={{ marginBottom: '1.5rem' }} />
            <p className="text-muted" style={{ fontSize: '1.1rem' }}>Sincronizando com radares globais...</p>
        </div>
      ) : (
        <div className="discovery-grid animate-fade-in">
          {activeTab === 'sources' ? (
            <div className="discovery-list flex-column" style={{ gap: '1.2rem' }}>
              {filteredSources.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed var(--border-color)' }}>
                    <Database size={40} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3 className="text-muted">Nenhuma fonte encontrada.</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Tente outro termo ou ajuste seus radares de busca.</p>
                </div>
              ) : (
                filteredSources.map(source => (
                  <div key={source.id} className="card flex-between animate-slide-up" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', transition: 'transform 0.2s ease' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>{source.source.toUpperCase()}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            <Calendar size={14} /> {new Date(source.published_at || source.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>{source.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: '2rem' }}>
                      <a href={source.url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '0.75rem', borderRadius: '12px' }} title="Ver conteúdo original">
                        <ExternalLink size={20} />
                      </a>
                      <button className="btn btn-primary" onClick={() => handleGenerateFromSource(source.title)} style={{ 
                          fontSize: '0.85rem', 
                          padding: '0.8rem 1.5rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
                      }}>
                        <Zap size={16} /> Gerar agora
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="discovery-list flex-column" style={{ gap: '1.5rem' }}>
              {filteredInsights.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed var(--border-color)' }}>
                    <Lightbulb size={40} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3 className="text-muted">Nenhum insight disponível.</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Os insights aparecem conforme a IA descobre tendências valiosas.</p>
                </div>
              ) : (
                filteredInsights.map(insight => (
                  <div key={insight.id} className="card animate-slide-up" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-color)', background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), transparent)' }}>
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <BarChart2 size={20} color="var(--accent-color)" />
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.05em' }}>INSIGHT ESTRATÉGICO</span>
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(insight.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p style={{ fontSize: '1.2rem', color: '#fff', lineHeight: '1.6', marginBottom: '2rem', fontStyle: 'italic', fontWeight: 500 }}>"{insight.business_insight}"</p>
                    
                    <div className="flex-between" style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 700 }}>Fonte de Origem</p>
                          <p style={{ color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insight.content_sources?.title || 'Relatório de Mercado IA'}</p>
                      </div>
                      <button className="btn btn-primary" onClick={() => handleGenerateFromSource(insight.business_insight)} style={{ 
                          fontSize: '0.85rem', 
                          padding: '0.7rem 1.2rem',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginLeft: '2rem'
                      }}>
                        <Flash size={14} /> Usar agora
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Flash({ size }: { size: number }) {
    return <Zap size={size} />;
}
