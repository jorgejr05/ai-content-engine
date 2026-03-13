import { useState, useRef, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Send, Bot, User, Search, Zap, FileText, BarChart3, Mic, Square, Loader } from 'lucide-react';

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

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'SEARCH': return <Search size={14} />;
      case 'ANALYZE': return <Zap size={14} />;
      case 'GENERATE': return <FileText size={14} />;
      case 'STATUS': return <BarChart3 size={14} />;
      default: return null;
    }
  };

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
    // Adicionar a mensagem do usuário imediatamente
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
      isAudio
    };
    setMessages(prev => [...prev, userMsg]);

    // Mostrar indicador de "digitando" imediatamente
    const typingId = addTypingMessage();

    // Delay de 10 segundos — simula "leitura" do agente
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      const response = await fetch('http://localhost:3001/api/agent', {
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
        text: '❌ Não consegui me conectar ao servidor. Verifique se o backend está rodando.',
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

  // ---- Gravação de Áudio ----
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

        // Para simplificar sem backend de transcrição, vamos enviar uma mensagem simulada
        // Em produção: enviar o blob para Whisper API ou similar
        const duration = recordingTime;
        sendToAgent(`[🎤 Áudio de ${duration}s] Analise as últimas tendências de IA para pequenas empresas`, true);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch {
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ---- Renderização de dados estruturados ----
  const renderData = (msg: Message) => {
    if (!msg.data) return null;

    if (msg.action === 'SEARCH' && msg.data.sources) {
      return (
        <div style={{ marginTop: '0.8rem' }}>
          {msg.data.total === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum resultado encontrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {msg.data.sources.slice(0, 5).map((s: any, i: number) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{
                  display: 'block', padding: '0.6rem 0.8rem',
                  background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                  textDecoration: 'none', color: '#e2e8f0', fontSize: '0.8rem'
                }}>
                  <strong>{s.title}</strong>
                  <br />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{s.source} • {new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
                </a>
              ))}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.data.total} resultados</p>
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
            <div key={i} style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{s.value || 0}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      );
    }

    if (msg.action === 'GENERATE' && msg.data.post_created) {
      return (
        <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(34,197,94,0.05)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p style={{ fontSize: '0.8rem', color: '#22c55e' }}>✅ Post criado!</p>
          <p style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '0.3rem', fontStyle: 'italic' }}>"{msg.data.preview}"</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)' }}>
      {/* Header do Chat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-color), #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Bot size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.1rem' }}>Agente IA</h2>
          <p style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Online</p>
        </div>
      </div>

      {/* Chat Messages — WhatsApp style */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem',
        background: 'rgba(0,0,0,0.15)', borderRadius: '12px',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(124,58,237,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(96,165,250,0.03) 0%, transparent 50%)',
        display: 'flex', flexDirection: 'column', gap: '0.6rem'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end', gap: '0.5rem'
          }}>
            {/* Avatar do agente */}
            {msg.role === 'agent' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent-color), #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={14} color="#fff" />
              </div>
            )}

            {/* Bolha */}
            <div style={{
              maxWidth: '75%', minWidth: '80px',
              padding: msg.isTyping ? '0.8rem 1.2rem' : '0.7rem 1rem',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                : 'rgba(255,255,255,0.07)',
              position: 'relative' as const
            }}>
              {msg.isTyping ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  digitando...
                </div>
              ) : (
                <>
                  {msg.isAudio && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <Mic size={14} color={msg.role === 'user' ? '#fff' : '#60a5fa'} />
                      <div style={{ height: '3px', flex: 1, borderRadius: '2px', background: 'rgba(255,255,255,0.3)' }} />
                    </div>
                  )}
                  {msg.action && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase' as const,
                      color: '#60a5fa', marginBottom: '0.3rem', letterSpacing: '0.5px'
                    }}>
                      {getActionIcon(msg.action)} {msg.action}
                    </span>
                  )}
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#fff', whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
                  {renderData(msg)}
                  <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem', textAlign: 'right' as const }}>
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}
            </div>

            {/* Avatar do usuário */}
            {msg.role === 'user' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={14} color="#fff" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area — WhatsApp style */}
      <form onSubmit={handleSend} style={{
        display: 'flex', gap: '0.6rem', alignItems: 'center',
        marginTop: '0.8rem', padding: '0.6rem',
        background: 'var(--bg-secondary)',
        borderRadius: '50px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {isRecording ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0 1rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 600 }}>Gravando... {formatTime(recordingTime)}</span>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={stopRecording} className="btn" style={{
              background: '#ef4444', color: '#fff', borderRadius: '50%',
              width: '40px', height: '40px', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Square size={16} />
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Digite uma mensagem..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '0.9rem', padding: '0.5rem 1rem'
              }}
            />
            {input.trim() ? (
              <button type="submit" className="btn btn-primary" style={{
                borderRadius: '50%', width: '40px', height: '40px', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Send size={18} />
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="btn" style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%',
                width: '40px', height: '40px', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Mic size={18} />
              </button>
            )}
          </>
        )}
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
