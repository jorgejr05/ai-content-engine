import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../config/supabase';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  author: string;
  published_at: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (!error && data) setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <div className="container animate-fade" style={{ paddingTop: '100px' }}>
      <Helmet>
        <title>Blog | AI Content Engine - Insights e Tendências de IA</title>
        <meta name="description" content="Fique por dentro das últimas notícias e técnicas de geração de conteúdo com inteligência artificial." />
      </Helmet>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem' }}>Insights do Pipeline</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>Tendências extraídas diretamente do nosso motor de inteligência aplicado ao mercado real.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>Carregando insights...</div>
      ) : posts.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>O Agente IA ainda não publicou conteúdo público. Volte em breve!</p>
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="glass blog-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <img src={post.featured_image || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop'} alt={post.title} />
              <div className="blog-card-content">
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(post.published_at).toLocaleDateString()}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={14} /> {post.author}</div>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>{post.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{post.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                  Ler mais <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
