import { useState, useRef, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Send, Bot, Mic, Square, Loader } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  action?: string;
  data?: any;
  timestamp: Date;
  isTyping?: boolean;
  isAudio?: boolean;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'agent',
      text: 'Olá! Sou seu Agente de Inteligência de Conteúdo. 🧠\n\nPosso pesquisar notícias, analisar tendências, gerar posts e mais.\n\nExemplos:\n• "Pesquise sobre IA em saúde"\n• "Analise tendências de automação"\n• "Gere um post sobre chatbots"\n• "Status do sistema"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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

    // Delay de 10 segundos
    await new Promise(resolve => setTimeout(resolve, 10000));

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
        text: data.response || data.error || 'Erro ao conectar com o agente.',
        action: data.action,
        data: data.data,
        timestamp: new Date()
      };

      replaceTypingWithResponse(typingId, agentMsg);
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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
        sendToAgent(`[🎤 Áudio] Analise tendências recentes baseadas no meu comando de voz.`, true);
      };

      mediaRecorder.start();
      setIsRecording(true);

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch {
      alert('Acesso ao microfone negado.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const renderData = (msg: Message) => {
    if (!msg.data) return null;

    if (msg.action === 'SEARCH' && msg.data.sources) {
      return (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {msg.data.sources.slice(0, 5).map((s: any, i: number) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="card" style={{
              display: 'block', padding: '1rem', textDecoration: 'none', background: 'rgba(255,255,255,0.03)'
            }}>
              <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{s.title}</strong>
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{s.source}</div>
            </a>
          ))}
        </div>
      );
    }

    if (msg.action === 'ANALYZE' && msg.data.content_angles) {
      return (
        <div className="card" style={{ marginTop: '1rem', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '0.8rem' }}>🧠 Estratégia Recomendada:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {msg.data.content_angles.map((a: string, i: number) => (
               <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                 <span>•</span> <span>{a}</span>
               </div>
             ))}
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="badge badge-purple">Viral: {msg.data.viral_potential}/10</span>
          </div>
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 8rem)', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          width: '50px', height: '50px', borderRadius: '16px', 
          background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Bot size={28} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Agente de Inteligência</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
             <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>Pronto para pesquisar</span>
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
              maxWidth: '80%',
              padding: '1rem 1.25rem',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, var(--accent-color), #7c3aed)' 
                : 'var(--bg-card)',
              border: '1px solid',
              borderColor: msg.role === 'user' ? 'transparent' : 'var(--border-color)',
              boxShadow: msg.role === 'user' ? '0 10px 20px -10px rgba(139, 92, 246, 0.5)' : 'none'
            }}>
              {msg.isTyping ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Loader size={16} className="animate-spin" />
                  <span>Sintonizando frequências...</span>
                </div>
              ) : (
                <>
                  {msg.isAudio && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      <Mic size={16} />
                      <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  )}
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#fff', whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
                  {renderData(msg)}
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.8rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
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
        marginTop: '1.5rem', padding: '0.5rem',
        background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
        border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '0.5rem'
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
              placeholder="Pergunte algo ou peça uma pesquisa..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '1rem', padding: '0.8rem 1.2rem', fontFamily: 'inherit'
              }}
            />
            {input.trim() ? (
              <button type="submit" className="btn-primary" style={{ borderRadius: '14px', width: '45px', height: '45px', padding: 0 }}>
                <Send size={20} />
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="btn-ghost" style={{ borderRadius: '14px', width: '45px', height: '45px', padding: 0 }}>
                <Mic size={20} />
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
