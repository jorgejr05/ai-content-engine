import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { FileText, Calendar, User, ExternalLink } from 'lucide-react';

export default function Blog() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    async function loadArticles() {
      const { data } = await supabase
         .from('generated_posts')
         .select('*, content_insights(business_insight)')
         .eq('platform', 'blog')
         .order('created_at', { ascending: false });
         
      if(data) setArticles(data);
      setLoading(false);
    }
    loadArticles();
  }, []);

  if (selectedArticle) {
    return (
      <div className="animate-fade-in">
        <button className="btn btn-ghost" onClick={() => setSelectedArticle(null)} style={{ marginBottom: '1rem' }}>
          ← Voltar para a lista
        </button>
        
        <div className="card" style={{ padding: '3rem', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', lineHeight: '1.2' }}>{selectedArticle.content_json?.title}</h1>
            
            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16}/> {new Date(selectedArticle.created_at).toLocaleDateString('pt-BR')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16}/> IA Content Engine</span>
                </div>
            </div>

            <div className="blog-content" style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#e2e8f0' }}>
                {selectedArticle.content_json?.content.split('\n').map((para: string, i: number) => (
                  <p key={i} style={{ marginBottom: '1.5rem' }}>{para}</p>
                ))}
            </div>

            {selectedArticle.content_json?.image_prompt && (
               <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(96, 165, 250, 0.05)', borderRadius: '12px', border: '1px dashed #60a5fa' }}>
                  <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>Prompt de Imagem Sugerido:</h4>
                  <p className="text-muted" style={{ fontStyle: 'italic' }}>{selectedArticle.content_json.image_prompt}</p>
               </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1>Portal de Artigos (Master Blog)</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Estes são os artigos master de onde todos os outros posts são derivados.</p>

      {loading ? (
        <p className="text-muted">Carregando acervo de conhecimento...</p>
      ) : articles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="text-muted">Nenhum artigo gerado ainda.</p>
        </div>
      ) : (
        <div className="grid-2">
          {articles.map(article => (
            <div key={article.id} className="card flex-column" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setSelectedArticle(article)}>
               <div className="flex-between">
                  <span className="badge badge-green">Master Article</span>
                  <FileText className="text-muted" size={18} />
               </div>
               
               <h3 style={{ marginTop: '1rem', color: '#fff', fontSize: '1.2rem' }}>{article.content_json?.title}</h3>
               <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {article.content_json?.summary}
               </p>

               <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                  <button className="btn btn-ghost" style={{ gap: '0.5rem' }}>
                    Ler Artigo <ExternalLink size={14} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
