import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function loadPosts() {
      const { data } = await supabase
         .from('generated_posts')
         .select('*, content_insights(business_insight, content_sources(title, url))')
         .eq('status', 'pending')
         .order('created_at', { ascending: false });
         
      if(data) setPosts(data);
    }
    loadPosts();
  }, []);

  const handlePublish = async (postId: string) => {
     try {
       // Chamamos o backend local (Express) que lida com as credenciais do Buffer
       const response = await fetch('http://localhost:3001/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
       });
       
       const resData = await response.json();
       if (response.ok && resData.success) {
          alert('✅ Post enviado para o LinkedIn com sucesso!');
          // Atualizar o frontend removendo da fila
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
      <h1>Revisão de Posts Gerados</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Estes são os conteúdos gerados pelo Llama 3. Aprova ou descarte.</p>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="text-muted">Nenhum post na fila no momento.</p>
        </div>
      ) : (
        <div className="grid-2">
          {posts.map(post => (
            <div key={post.id} className="card flex-column">
               <div className="flex-between">
                  <span className="badge badge-purple">{post.platform}</span>
                  <span className="text-muted" style={{fontSize: '0.8rem'}}>Pendente</span>
               </div>
               
               <div style={{ marginTop: '0.5rem' }}>
                 <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Fonte: {post.content_insights?.content_sources?.title}</p>
                 <h4 style={{ marginBottom: '1rem', color: '#fff' }}>{post.content_json?.hook}</h4>
                 
                 <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {post.content_json?.full_post}
                 </div>
               </div>

               <div className="flex-between" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-ghost" style={{ color: '#ef4444' }}>
                     <XCircle size={16} /> Descartar
                  </button>
                  <button className="btn btn-primary" onClick={() => handlePublish(post.id)}>
                     <CheckCircle size={16} /> Aprovar e Publicar
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
