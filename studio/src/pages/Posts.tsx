import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { XCircle, FileText, Linkedin, Instagram, Video, ChevronDown, ChevronUp } from 'lucide-react';

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [expandedMaster, setExpandedMaster] = useState<string | null>(null);

  useEffect(() => {
    async function loadPosts() {
      const { data } = await supabase
         .from('generated_posts')
         .select('*, content_insights(business_insight, content_sources(title), community_discussions(title))')
         .eq('status', 'pending')
         .order('created_at', { ascending: false });
         
      if(data) setPosts(data);
    }
    loadPosts();
  }, []);

  const masterPosts = posts.filter(p => !p.master_post_id);
  const getDerivedPosts = (masterId: string) => posts.filter(p => p.master_post_id === masterId);

  const handlePublish = async (postId: string) => {
     try {
       const response = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
       });
       
       const resData = await response.json();
       if (response.ok && resData.success) {
          alert('✅ Conteúdo enviado para publicação!');
          setPosts(posts.filter(p => p.id !== postId));
       } else {
          alert(`❌ Erro: ${resData.error}`);
       }
     } catch(e: any) {
        alert(`❌ Erro ao comunicar com API local: ${e.message}`);
     }
  };

  return (
    <div className="animate-fade-in">
      <h1>Central de Conteúdo (Flywheel)</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Aprove os pacotes multimídia gerados a partir dos insights de ouro.</p>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="text-muted">Nenhum conteúdo na fila no momento. Peça ao Agente para gerar algo!</p>
        </div>
      ) : (
        <div className="flex-column" style={{ gap: '2rem' }}>
          {/* 1. Pacotes Estruturados (Master/Blog) */}
          {masterPosts.filter(p => p.platform === 'master' || p.platform === 'blog').map(master => {
            const derived = getDerivedPosts(master.id);
            const isExpanded = expandedMaster === master.id;
            const sourceTitle = master.content_insights?.content_sources?.title || master.content_insights?.community_discussions?.title || 'Insight Estratégico';

            return (
              <div key={master.id} className="card flex-column" style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                   <div className="flex-between">
                      <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14}/> Pacote Multimídia
                      </span>
                      <span className="text-muted" style={{fontSize: '0.8rem'}}>Insight: {sourceTitle.substring(0, 40)}...</span>
                   </div>
                   <h2 style={{ marginTop: '1rem', color: '#fff', fontSize: '1.4rem' }}>{master.content_json?.title || 'Conteúdo Master'}</h2>
                   <p className="text-muted" style={{ marginTop: '0.5rem' }}>{master.content_json?.summary || 'Sem resumo disponível.'}</p>
                   
                   <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                      <button className="btn btn-ghost" onClick={() => setExpandedMaster(isExpanded ? null : master.id)}>
                        {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>} 
                        {isExpanded ? 'Esconder Detalhes' : `Ver ${derived.length} formatos curtos`}
                      </button>
                      <button className="btn btn-primary" onClick={() => handlePublish(master.id)}>
                         Aprovar Master
                      </button>
                   </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                    {derived.map(item => <PostCard key={item.id} item={item} onPublish={handlePublish} />)}
                  </div>
                )}
              </div>
            );
          })}

          {/* 2. Posts Standalone (Gerados pelo Agente) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {posts.filter(p => !p.master_post_id && p.platform !== 'master' && p.platform !== 'blog').map(item => (
              <PostCard key={item.id} item={item} onPublish={handlePublish} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ item, onPublish }: { item: any, onPublish: (id: string) => void }) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'tiktok': case 'video': return <Video size={16} />;
      case 'twitter': case 'x': return <span>𝕏</span>;
      default: return <FileText size={16} />;
    }
  };

  const displayText = item.content_json?.text || item.content_json?.script || item.content_json?.slides?.join('\n\n') || 'Sem conteúdo disponível.';
  
  return (
    <div className="card flex-column" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '16px' }}>
       <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             {getPlatformIcon(item.platform)} {item.platform.toUpperCase()}
          </span>
       </div>
       <div style={{ fontSize: '0.85rem', color: '#eee', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', minHeight: '120px', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
           {displayText.length > 800 ? displayText.substring(0, 800) + '...' : displayText}
       </div>

       {item.content_json?.suggestion && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '10px', border: '1px dashed #22c55e', color: '#22c55e', fontSize: '0.75rem' }}>
             🚀 ESTRATÉGIA: {item.content_json.suggestion}
          </div>
       )}

       <div className="flex-between" style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-ghost" style={{ color: '#ef4444', padding: '0.5rem' }} title="Descartar">
             <XCircle size={18} />
          </button>
          <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => onPublish(item.id)}>
             Aprovar e Postar
          </button>
       </div>
    </div>
  );
}
