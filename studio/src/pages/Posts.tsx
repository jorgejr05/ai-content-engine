import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { 
  XCircle, FileText, Linkedin, Instagram, Video, 
  ChevronDown, ChevronUp, Sparkles, CheckCircle, Clock 
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [expandedMaster, setExpandedMaster] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'published'>('pending');
  const { addNotification } = useNotifications();

  const loadPosts = async () => {
    const { data } = await supabase
       .from('generated_posts')
       .select('*, content_insights(business_insight, content_sources(title), community_discussions(title))')
       .eq('status', filter)
       .order('created_at', { ascending: false });
       
    if(data) setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

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
          addNotification('success', 'Conteúdo publicado com sucesso!');
          loadPosts();
       } else {
          addNotification('error', `Erro: ${resData.error}`);
       }
     } catch(e: any) {
        addNotification('error', `Erro ao publicar: ${e.message}`);
     }
  };

  const handleAIEdit = async (postId: string, currentContent: any, instruction: string) => {
    if (!instruction) return;
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'AI_EDIT', 
          details: { postId, currentContent, instruction } 
        })
      });
      const data = await response.json();
      if (data.success) {
        const { error } = await supabase
          .from('generated_posts')
          .update({ content_json: data.newContent })
          .eq('id', postId);
        
        if (!error) {
          addNotification('success', 'Conteúdo refinado pela IA!');
          loadPosts();
        }
      }
    } catch (e) {
      addNotification('error', 'Erro ao editar com IA.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Central de Conteúdo</h1>
          <p className="text-muted">Gerencie, edite e acompanhe suas publicações.</p>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setFilter('pending')}
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '10px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            <Clock size={14} style={{ marginRight: '0.5rem' }} /> Pendentes
          </button>
          <button 
            onClick={() => setFilter('published')}
            className={`btn ${filter === 'published' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '10px', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            <CheckCircle size={14} style={{ marginRight: '0.5rem' }} /> Publicados
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <FileText size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <p className="text-muted">Nenhum conteúdo {filter === 'pending' ? 'pendente' : 'publicado'} encontrado.</p>
        </div>
      ) : (
        <div className="flex-column" style={{ gap: '2rem' }}>
          {/* Pacotes Master */}
          {masterPosts.filter(p => p.platform === 'master' || p.platform === 'blog').map(master => {
            const derived = getDerivedPosts(master.id);
            const isExpanded = expandedMaster === master.id;
            return (
              <div key={master.id} className="card flex-column" style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                   <div className="flex-between">
                      <span className="badge badge-green">PACOTE MASTER</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(master.created_at).toLocaleDateString()}</span>
                   </div>
                   <h2 style={{ marginTop: '1rem', color: '#fff' }}>{master.content_json?.title}</h2>
                   <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                      <button className="btn btn-ghost" onClick={() => setExpandedMaster(isExpanded ? null : master.id)}>
                        {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>} 
                        {isExpanded ? 'Ocultar Canais' : `Ver ${derived.length} Canais Gerados`}
                      </button>
                      {filter === 'pending' && (
                        <button className="btn btn-primary" onClick={() => handlePublish(master.id)}>Publicar Master</button>
                      )}
                   </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                    {derived.map(item => <PostCard key={item.id} item={item} onPublish={handlePublish} onAIEdit={handleAIEdit} isReadOnly={filter === 'published'} />)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Posts Individuais/Avulsos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {posts.filter(p => !p.master_post_id && p.platform !== 'master' && p.platform !== 'blog').map(item => (
              <PostCard key={item.id} item={item} onPublish={handlePublish} onAIEdit={handleAIEdit} isReadOnly={filter === 'published'} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ item, onPublish, onAIEdit, isReadOnly }: { item: any, onPublish: (id: string) => void, onAIEdit: (id: string, content: any, inst: string) => void, isReadOnly: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [instruction, setInstruction] = useState('');

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'tiktok': case 'video': return <Video size={16} />;
      default: return <span>𝕏</span>;
    }
  };

  const displayText = item.content_json?.text || item.content_json?.script || item.content_json?.slides?.join('\n\n');
  
  return (
    <div className="card flex-column" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem' }}>
       <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <span className="badge badge-purple" style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
             {getPlatformIcon(item.platform)} {item.platform.toUpperCase()}
          </span>
          {isReadOnly && <span className="badge badge-green">PUBLICADO</span>}
       </div>

       <div style={{ fontSize: '0.85rem', color: '#eee', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', minHeight: '120px', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
           {displayText}
       </div>

       {!isReadOnly && (
         <>
           {isEditing ? (
             <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--accent-color)', marginBottom: '1rem' }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700, marginBottom: '0.5rem' }}>O QUE VOCÊ QUER MUDAR?</p>
               <input 
                 className="input" 
                 autoFocus
                 placeholder="Ex: Deixe mais engraçado ou mude o CTA..." 
                 value={instruction} 
                 onChange={e => setInstruction(e.target.value)}
                 style={{ width: '100%', marginBottom: '0.5rem' }}
               />
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => { onAIEdit(item.id, item.content_json, instruction); setIsEditing(false); }}>Refinar com IA</button>
                 <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => setIsEditing(false)}>Cancelar</button>
               </div>
             </div>
           ) : (
             <button className="btn btn-ghost" style={{ width: '100%', marginBottom: '1rem', border: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.8rem', gap: '0.5rem' }} onClick={() => setIsEditing(true)}>
               <Sparkles size={14} color="var(--accent-color)" /> Editar com IA
             </button>
           )}

           <div className="flex-between">
              <button className="btn btn-ghost" style={{ color: '#ef4444' }}><XCircle size={18} /></button>
              <button className="btn btn-primary" onClick={() => onPublish(item.id)}>Aprovar e Postar</button>
           </div>
         </>
       )}
    </div>
  );
}
