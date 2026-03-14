import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../config/supabase';
import { Calendar, User, ChevronLeft } from 'lucide-react';

interface BlogPost {
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  featured_image: string;
  author: string;
  published_at: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (!error && data) setPost(data);
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  if (loading) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Sincronizando conteúdo...</div>;
  if (!post) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Post não encontrado. <Link to="/blog">Voltar</Link></div>;

  return (
    <div className="animate-fade">
      <Helmet>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description} />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description} />
        <meta property="og:image" content={post.featured_image} />
      </Helmet>

      <div className="container" style={{ paddingTop: '60px', maxWidth: '800px' }}>
        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}>
          <ChevronLeft size={16} /> Voltar para o Blog
        </Link>
        
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '1.5rem' }}>{post.title}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={18} /> {new Date(post.published_at).toLocaleDateString('pt-BR')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={18} /> {post.author}</div>
          </div>
        </header>

        {post.featured_image && (
          <img src={post.featured_image} alt={post.title} style={{ width: '100%', borderRadius: '24px', marginBottom: '3rem', display: 'block', maxHeight: '500px', objectFit: 'cover' }} />
        )}

        <article 
          className="blog-content" 
          style={{ fontSize: '1.15rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
}
