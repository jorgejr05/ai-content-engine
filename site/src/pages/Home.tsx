import { Helmet } from 'react-helmet-async';
import { ArrowRight, Zap, Target, BarChart3, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="animate-fade">
      <Helmet>
        <title>AI Content Engine | Sua Escala de Conteúdo no Automático</title>
        <meta name="description" content="A ferramenta definitiva de inteligência de conteúdo. Descubra tendências, gere posts multicanais e domine as redes sociais com IA." />
      </Helmet>

      <section className="hero container">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '99px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '2rem' }}>
          <Zap size={16} color="var(--accent-primary)" />
          <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>O Futuro do Conteúdo Chegou</span>
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '2rem' }}>
          Transforme <span className="gradient-text">Trends</span> em <br /> Resultando <span className="gradient-text">Real</span>.
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
          Nossos Agentes de IA filtram o ruído, encontram os melhores insights e geram conteúdos multicanais otimizados para viralizar.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="http://localhost:5173" className="btn-premium" style={{ height: '60px', padding: '0 3rem', fontSize: '1.1rem' }}>
            Começar Grátis <ArrowRight />
          </a>
          <Link to="/blog" className="glass" style={{ height: '60px', padding: '0 3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
             Ver Blog
          </Link>
        </div>
      </section>

      <section className="container" style={{ paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Um Squad Completo aos seus pés</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Operamos como um pipeline de agência, mas com a velocidade do silício.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {[
            { icon: <Target />, title: 'Trend Discovery', desc: 'Monitoramento em tempo real de notícias e insights virais do seu setor.' },
            { icon: <Zap />, title: 'Geração Multicanal', desc: 'Posts otimizados para LinkedIn, Instagram, TikTok e Twitter em segundos.' },
            { icon: <BarChart3 />, title: 'Viral Score', desc: 'Nossa IA prevê o potencial de engajamento antes mesmo de você postar.' },
            { icon: <Globe />, title: 'Blog Integrado', desc: 'Transforme insights em artigos de blog otimizados para SEO automaticamente.' }
          ].map((feature, i) => (
            <div key={i} className="glass" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
