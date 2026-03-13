import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, Bot, User, Search, Zap, FileText, BarChart3 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  action?: string;
  data?: any;
  timestamp: Date;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'agent',
      text: 'Olá! Sou seu Agente de Inteligência de Conteúdo. Posso pesquisar notícias, analisar tendências, gerar posts e mais. O que você precisa?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'SEARCH': return <Search size={14} />;
      case 'ANALYZE': return <Zap size={14} />;
      case 'GENERATE': return <FileText size={14} />;
      case 'STATUS': return <BarChart3 size={14} />;
      default: return null;
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: data.response || data.error || 'Erro ao conectar com o agente.',
        action: data.action,
        data: data.data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: '❌ Não consegui me conectar ao servidor backend. Verifique se ele está rodando na porta 3001.',
        timestamp: new Date()
      }]);
    }

    setLoading(false);
  };

  const renderData = (msg: Message) => {
    if (!msg.data) return null;

    if (msg.action === 'SEARCH' && msg.data.sources) {
      return (
        <div style={{ marginTop: '0.8rem' }}>
          {msg.data.total === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum resultado encontrado no banco. Tente outro termo.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {msg.data.sources.slice(0, 5).map((s: any, i: number) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{
                  display: 'block', padding: '0.6rem 0.8rem',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none', color: '#e2e8f0', fontSize: '0.8rem'
                }}>
                  <strong>{s.title}</strong>
                  <br />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{s.source} • {new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
                </a>
              ))}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.data.total} resultados encontrados</p>
            </div>
          )}
        </div>
      );
    }

    if (msg.action === 'ANALYZE' && msg.data.content_angles) {
      return (
        <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(96,165,250,0.05)', borderRadius: '8px', border: '1px solid rgba(96,165,250,0.15)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#60a5fa', marginBottom: '0.5rem' }}>🧠 Ângulos de Conteúdo:</p>
          {msg.data.content_angles.map((a: string, i: number) => (
            <p key={i} style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.3rem' }}>• {a}</p>
          ))}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Potencial Viral: {msg.data.viral_potential}/10</p>
        </div>
      );
    }

    if (msg.action === 'STATUS') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.8rem' }}>
          {[
            { label: 'Fontes', value: msg.data.sources },
            { label: 'Insights', value: msg.data.insights },
            { label: 'Fila', value: msg.data.pending_posts }
          ].map((s, i) => (
            <div key={i} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>{s.value || 0}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      );
    }

    if (msg.action === 'GENERATE' && msg.data.post_created) {
      return (
        <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(34,197,94,0.05)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p style={{ fontSize: '0.8rem', color: '#22c55e' }}>✅ Post criado e adicionado à fila de revisão!</p>
          <p style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '0.3rem', fontStyle: 'italic' }}>"{msg.data.preview}"</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)' }}>
      <h1>Falar com Agente IA</h1>
      <p className="text-muted" style={{ marginBottom: '1rem' }}>Peça pesquisas, análises de tendências, geração de conteúdo e mais.</p>

      {/* Chat Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.5rem',
        background: 'rgba(0,0,0,0.2)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', gap: '0.8rem',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start'
          }}>
            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: msg.role === 'agent'
                ? 'linear-gradient(135deg, var(--accent-color), #7c3aed)'
                : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {msg.role === 'agent' ? <Bot size={18} color="#fff" /> : <User size={18} color="#fff" />}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '70%',
              padding: '1rem 1.2rem',
              borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--accent-color), #7c3aed)'
                : 'var(--bg-secondary)',
              border: msg.role === 'agent' ? '1px solid rgba(255,255,255,0.08)' : 'none'
            }}>
              {msg.action && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
                  color: '#60a5fa', marginBottom: '0.4rem', letterSpacing: '0.5px'
                }}>
                  {getActionIcon(msg.action)} {msg.action}
                </span>
              )}
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#fff', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              {renderData(msg)}
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem', textAlign: 'right' }}>
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-color), #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={18} color="#fff" />
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '4px 14px 14px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Pensando...</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{
        display: 'flex', gap: '0.8rem',
        marginTop: '1rem', padding: '0.8rem',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Pesquise sobre IA em saúde, analise tendências de automação, gere um post..."
          disabled={loading}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: '0.95rem', padding: '0.5rem'
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
