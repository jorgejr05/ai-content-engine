import { useState, useRef, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Send, Bot, Mic, Square, Loader, Sparkles, Copy } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  action?: string;
  data?: any;
  timestamp: Date;
  isTyping?: boolean;
  isAudio?: boolean;
  next_suggestion?: string;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'agent',
      text: 'Olá! Sou seu Content Strategist & Growth Agent. 🧠\n\nEu posso varrer bancos de notícias, buscar tendências da semana ou do mês e gerar kits completos de conteúdo para suas redes sociais.\n\nO que vamos dominar hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [typingStatus, setTypingStatus] = useState('Analisando seu pedido...');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addTypingMessage = useCallback(() => {
    const typingId = 'typing-' + Date.now();
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'agent',
      text: '',
      timestamp: new Date(),
      isTyping: true
    }]);
    return typingId;
  }, []);

  const replaceTypingWithResponse = useCallback((typingId: string, response: Message) => {
    setMessages(prev => prev.map(m => m.id === typingId ? response : m));
  }, []);

  const sendToAgent = useCallback(async (text: string, isAudio = false) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
      isAudio
    };
    setMessages(prev => [...prev, userMsg]);

    const typingId = addTypingMessage();
    
    // Status Dinâmicos para Humanização
    const statuses = [
      "Interpretando sua intenção...",
      "Acessando banco de dados estratégico...",
      "Filtrando tendências recentes...",
      "Sintetizando insights de mercado...",
      "Formatando kit multicanal...",
      "Finalizando resposta estratégica..."
    ];

    let currentStatusIdx = 0;
    const statusInterval = setInterval(() => {
      setTypingStatus(statuses[currentStatusIdx % statuses.length]);
      currentStatusIdx++;
    }, 1500);

    // Delay de 10 segundos como solicitado
    await new Promise(resolve => setTimeout(resolve, 10000));
    clearInterval(statusInterval);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: data.response || data.error || 'Processamento concluído.',
        action: data.action,
        data: data.data,
        next_suggestion: data.next_suggestion,
        timestamp: new Date()
      };

      replaceTypingWithResponse(typingId, agentMsg);
      setTypingStatus('Analisando seu pedido...');
    } catch {
      replaceTypingWithResponse(typingId, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: '❌ Erro de conexão. Verifique se as variáveis de ambiente estão configuradas na Vercel.',
        timestamp: new Date()
      });
    }
  }, [addTypingMessage, replaceTypingWithResponse]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    sendToAgent(text);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
        sendToAgent(`[🎤 Áudio] Analise e sugira conteúdo baseado no meu comando de voz.`, true);
      };
      mediaRecorder.start();
      setIsRecording(true);
      let seconds = 0;
      timerRef.current = setInterval(() => { seconds++; setRecordingTime(seconds); }, 1000);
    } catch { alert('Microfone negado.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const renderData = (msg: Message) => {
    if (!msg.data) return null;

    if (msg.action === 'RESEARCH' && msg.data.summary) {
      return (
        <div style={{ marginTop: '1rem' }}>
          <div className="card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} /> Resumo Estratégico
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.6', marginBottom: '1.5rem' }}>{msg.data.summary}</p>
            
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fontes Relevantes</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {msg.data.sources?.slice(0,3).map((s: any, i: number) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ 
                  fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none',
                  padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (msg.action === 'MULTI_GENERATE') {
      const platforms = [
        { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
        { id: 'instagram', label: 'Instagram', color: '#E4405F' },
        { id: 'twitter', label: 'Twitter/X', color: '#fff' },
        { id: 'tiktok', label: 'TikTok', color: '#00F2EA' }
      ];

      return (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2" style={{ gap: '0.8rem' }}>
            {platforms.map(p => {
              const content = msg.data[p.id];
              if (!content) return null;
              return (
                <div key={p.id} className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: p.color, opacity: 0.8 }}>{p.label}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                    {content.text || content.caption || (content.thread ? content.thread[0] : '') || content.script_hook}
                  </p>
                  <button className="btn-ghost" style={{ width: '100%', marginTop: '1rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Copy size={12} /> Copiar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (msg.action === 'SEARCH' && msg.data.sources) {
      return (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {msg.data.sources.slice(0, 5).map((s: any, i: number) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="card" style={{
              display: 'block', padding: '1rem', textDecoration: 'none', background: 'rgba(255,255,255,0.02)'
            }}>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{s.title}</strong>
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{s.source} • {new Date(s.created_at).toLocaleDateString()}</div>
            </a>
          ))}
        </div>
      );
    }

    if (msg.action === 'STATUS') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
          {[
            { label: 'Sinais', value: msg.data.sources, color: 'var(--accent-color)' },
            { label: 'Insights', value: msg.data.insights, color: 'var(--accent-secondary)' },
            { label: 'Drafts', value: msg.data.pending_posts, color: '#4ade80' }
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '0.8rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value || 0}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="animate-fade-in chat-page-container">
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          width: '50px', height: '50px', borderRadius: '16px', 
          background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
        }}>
          <Bot size={28} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Agente de Crescimento</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
             <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>Estrategista Online</span>
          </div>
        </div>
      </header>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.5rem',
        background: 'rgba(255,255,255,0.01)', borderRadius: '24px',
        border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
        scrollbarWidth: 'none'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: '1rem'
          }}>
            {msg.role === 'agent' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px'
              }}>
                <Bot size={18} color="var(--accent-color)" />
              </div>
            )}

            <div style={{
              maxWidth: '85%',
              padding: '1rem 1.25rem',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, var(--accent-color), #7c3aed)' 
                : 'var(--bg-card)',
              border: '1px solid',
              borderColor: msg.role === 'user' ? 'transparent' : 'var(--border-color)',
              boxShadow: msg.role === 'user' ? '0 10px 25px -10px rgba(139, 92, 246, 0.5)' : 'none'
            }}>
              {msg.isTyping ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Loader size={18} className="animate-spin" />
                  <span>{typingStatus}</span>
                </div>
              ) : (
                <>
                  {msg.isAudio && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      <Mic size={16} />
                      <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  )}
                  <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#fff', whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
                  {renderData(msg)}
                  
                  {msg.next_suggestion && (
                    <div style={{ 
                      marginTop: '1.25rem', padding: '0.75rem', 
                      background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                      border: '1px dashed rgba(255,255,255,0.2)',
                      fontSize: '0.85rem', color: 'var(--accent-secondary)'
                    }}>
                      💡 <strong>Dica:</strong> {msg.next_suggestion}
                    </div>
                  )}

                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '1rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} style={{
        marginTop: '1.5rem', padding: '0.6rem',
        background: 'rgba(255,255,255,0.03)', borderRadius: '24px',
        border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {isRecording ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1rem' }}>
             <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
             <span style={{ color: '#ef4444', fontWeight: 600 }}>Gravando: {formatTime(recordingTime)}</span>
             <div style={{ flex: 1 }} />
             <button type="button" onClick={stopRecording} className="btn" style={{ background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '0.6rem' }}>
                <Square size={18} />
             </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ex: Liste notícias de IA no ecommerce da semana e gere posts..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '1rem', padding: '0.8rem 1.2rem', fontFamily: 'inherit'
              }}
            />
            {input.trim() ? (
              <button type="submit" className="btn-primary" style={{ borderRadius: '16px', width: '48px', height: '48px', padding: 0 }}>
                <Send size={22} />
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="btn-ghost" style={{ borderRadius: '16px', width: '48px', height: '48px', padding: 0 }}>
                <Mic size={22} />
              </button>
            )}
          </>
        )}
      </form>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.7; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.7; } }
      `}</style>
    </div>
  );
}
