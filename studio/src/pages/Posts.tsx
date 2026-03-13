import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { CheckCircle, XCircle, FileText, Linkedin, Instagram, Video, ChevronDown, ChevronUp } from 'lucide-react';

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [expandedMaster, setExpandedMaster] = useState<string | null>(null);

  useEffect(() => {
    async function loadPosts() {
      // Carregar todos os posts pendentes
      const { data } = await supabase
         .from('generated_posts')
         .select('*, content_insights(business_insight, content_sources(title), community_discussions(title))')
         .eq('status', 'pending')
         .order('created_at', { ascending: false });
         
      if(data) setPosts(data);
    }
    loadPosts();
  }, []);

  // Agrupar posts derivados por Master
  const masterPosts = posts.filter(p => !p.master_post_id);
  const getDerivedPosts = (masterId: string) => posts.filter(p => p.master_post_id === masterId);

  const handlePublish = async (postId: string) => {
     try {
       const response = await fetch('http://localhost:3001/api/publish', {
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'video': return <Video size={16} />;
      case 'blog': return <FileText size={16} />;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <h1>Central de Conteúdo (Flywheel)</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Aprove os pacotes multimídia gerados a partir dos insights de ouro.</p>

      {masterPosts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="text-muted">Nenhum pacote de conteúdo na fila no momento.</p>
        </div>
      ) : (
        <div className="flex-column" style={{ gap: '2rem' }}>
          {masterPosts.map(master => {
            const derived = getDerivedPosts(master.id);
            const isExpanded = expandedMaster === master.id;
            const sourceTitle = master.content_insights?.content_sources?.title || master.content_insights?.community_discussions?.title || 'Insight Estratégico';

            return (
              <div key={master.id} className="card flex-column" style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0px', overflow: 'hidden' }}>
                {/* Header do Pacote (Master) */}
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                   <div className="flex-between">
                      <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14}/> Pacote Multimídia
                      </span>
                      <span className="text-muted" style={{fontSize: '0.8rem'}}>Insight: {sourceTitle.substring(0, 40)}...</span>
                   </div>
                   <h2 style={{ marginTop: '1rem', color: '#fff', fontSize: '1.4rem' }}>{master.content_json?.title}</h2>
                   <p className="text-muted" style={{ marginTop: '0.5rem' }}>{master.content_json?.summary}</p>
                   
                   <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                      <button className="btn btn-ghost" onClick={() => setExpandedMaster(isExpanded ? null : master.id)}>
                        {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>} 
                        {isExpanded ? 'Esconder Derivados' : `Ver ${derived.length} formatos derivados`}
                      </button>
                      <button className="btn btn-primary" onClick={() => handlePublish(master.id)}>
                         Publicar Artigo Master
                      </button>
                   </div>
                </div>

                {/* Conteúdos Derivados (Expansível) */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                    {derived.map(item => (
                      <div key={item.id} className="card flex-column" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div className="flex-between" style={{ marginBottom: '1rem' }}>
                            <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               {getPlatformIcon(item.platform)} {item.platform.toUpperCase()}
                            </span>
                         </div>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', minHeight: '150px', whiteSpace: 'pre-wrap' }}>
                             {item.platform === 'instagram' ? item.content_json?.slides?.join('\n\n') : (item.content_json?.text || item.content_json?.script)}
                         </div>

                         {/* Exibição do Prompt de Imagem se existir */}
                         {(item.content_json?.image_prompt || item.content_json?.cover_image_prompt) && (
                            <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '8px', border: '1px dashed #60a5fa' }}>
                               <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa', marginBottom: '0.4rem', textTransform: 'uppercase' }}>💡 Sugestão Visual (IA):</p>
                               <p style={{ fontSize: '0.8rem', color: '#fff', fontStyle: 'italic' }}>
                                  "{item.content_json?.image_prompt || item.content_json?.cover_image_prompt}"
                               </p>
                            </div>
                         )}

                         <div className="flex-between" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-ghost" style={{ color: '#ef4444', padding: '0.5rem' }} title="Descartar">
                               <XCircle size={18} />
                            </button>
                            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => handlePublish(item.id)}>
                               Aprovar {item.platform}
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
