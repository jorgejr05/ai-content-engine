import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Bot, Loader, Trash2, ThumbsUp, CheckCircle, 
  ChevronLeft, ChevronRight, TrendingUp, Target, RefreshCw, Globe
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../config/supabase';
import ConfirmModal from '../components/ConfirmModal';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  action?: string;
  data?: any;
  timestamp: Date;
  isTyping?: boolean;
  next_suggestion?: string;
}

export default function AgentChat() {
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typingStatus, setTypingStatus] = useState('Analisando seu pedido...');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Carregar histórico do Supabase
  const loadChatHistory = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'agent',
          text: m.content,
          action: m.action,
          data: m.data,
          next_suggestion: m.next_suggestion,
          timestamp: new Date(m.created_at)
        }));
        setMessages(formatted);
      } else {
        // Mensagem inicial se o banco estiver vazio
        setMessages([{
          id: 'initial',
          role: 'agent',
          text: 'Olá! Sou seu Editor-Chefe & Growth Strategist. 🧠\n\nEu comando o seu Pipeline Editorial: **Busca -> Insights -> Viral Score -> Geração Multicanal**.\n\nO que vamos dominar hoje?',
          timestamp: new Date()
        }]);
      }
    } catch (e: any) {
      console.error('Erro ao carregar chat:', e);
      addNotification('error', 'Erro ao carregar histórico de conversas.');
    }
    setLoadingInitial(false);
  }, [addNotification]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const pending = localStorage.getItem('pending_generation_topic');
    if (pending) {
      localStorage.removeItem('pending_generation_topic');
      sendToAgent(`Gere conteúdo multicanal com base nisto: ${pending}`);
    }
  }, []);

  const clearChat = async () => {
    try {
      const { error } = await supabase.from('agent_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) throw error;

      const initialMsg: Message = {
        id: Date.now().toString(),
        role: 'agent',
        text: 'Memória limpa. Pipeline editorial pronto para novos inputs! 🚀',
        timestamp: new Date()
      };
      setMessages([initialMsg]);
      addNotification('success', 'Histórico de conversa removido permanentemente.');
    } catch (e: any) {
      addNotification('error', 'Erro ao limpar histórico no banco.');
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

  const saveMessageToDb = async (msg: Message) => {
    try {
      await supabase.from('agent_messages').insert({
        id: msg.id.includes('typing') ? undefined : msg.id,
        role: msg.role,
        content: msg.text,
        action: msg.action,
        data: msg.data,
        next_suggestion: msg.next_suggestion,
        created_at: msg.timestamp.toISOString()
      });
    } catch (e) {
      console.error('Erro ao persistir mensagem:', e);
    }
  };

  const sendToAgent = useCallback(async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    saveMessageToDb(userMsg);

    const typingId = addTypingMessage();
    const statuses = ["Buscando tendências...", "Analisando Viral Score...", "Extraindo Insights de Negócio...", "Planejando Conteúdo...", "Formatando Pipeline..."];
    let idx = 0;
    const interval = setInterval(() => { setTypingStatus(statuses[idx % statuses.length]); idx++; }, 2000);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: messages
            .filter(m => !m.isTyping && m.text.trim() !== '')
            .slice(-10)
            .map(m => ({ role: m.role, text: m.text }))
        })
      });
      const data = await response.json();
      clearInterval(interval);

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: data.response || 'Análise concluída.',
        action: data.action,
        data: data.data,
        next_suggestion: data.next_suggestion,
        timestamp: new Date()
      };
      
      replaceTypingWithResponse(typingId, agentMsg);
      saveMessageToDb(agentMsg);
      setTypingStatus('Analisando seu pedido...');
    } catch {
      clearInterval(interval);
      replaceTypingWithResponse(typingId, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: '❌ Erro no pipeline editorial.',
        timestamp: new Date()
      });
      addNotification('error', 'Falha na conexão com o Agente.');
    }
  }, [messages, addTypingMessage, replaceTypingWithResponse, addNotification]);

  const handleAction = async (action: string, details: any) => {
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details })
      });
      const data = await response.json();
      if (data.success) {
        if (action === 'SAVE_TO_CENTRAL') {
          addNotification('success', 'Kit de conteúdo salvo na Central!');
        } else if (action === 'PUBLISH_TO_BLOG') {
          addNotification('success', 'Post publicado no Blog Público com sucesso!');
        } else {
          addNotification('success', 'Feedback registrado no aprendizado da IA.');
        }
      }
    } catch {
      addNotification('error', 'Erro ao processar sua solicitação.');
    }
  };

  const renderContentPreview = (data: any, action: string) => {
    if (action === 'MULTI_GENERATE') {
      return (
        <MultiChannelPreview 
          data={data} 
          onSave={(p, c) => handleAction('SAVE_TO_CENTRAL', { platform: p, content: c })} 
          onSaveAll={(platforms) => handleAction('SAVE_TO_CENTRAL', { platforms })}
          onLike={(p, topic, sample) => handleAction('SUBMIT_FEEDBACK', { platform: p, topic, is_positive: true, sample })} 
        />
      );
    }
    if (action === 'RESEARCH') {
      return <EditorialReport data={data} />;
    }
    return null;
  };

  if (loadingInitial) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
         <Bot size={48} className="animate-pulse" color="var(--accent-color)" />
         <p className="text-muted" style={{ marginTop: '1rem' }}>Sincronizando pipeline editorial...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in chat-page-container">
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={clearChat}
        title="Limpar Conversa"
        message="Tem certeza que deseja apagar todo o histórico de conversas permanentemente do banco de dados?"
        confirmText="Limpar agora"
        type="danger"
      />

      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-color), #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(236, 72, 153, 0.4)' }}>
            <Bot size={28} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Editor-Chefe IA</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
               <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>Editorial Pipeline Online</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadChatHistory} className="btn-ghost" title="Sincronizar">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => setIsConfirmOpen(true)} className="btn-ghost" style={{ color: '#ef4444' }} title="Limpar conversa">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.2rem', scrollbarWidth: 'none' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '1rem' }}>
            {msg.role === 'agent' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                <Bot size={18} color="var(--accent-color)" />
              </div>
            )}
            <div style={{ maxWidth: '85%', padding: '1rem 1.25rem', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-color), #7c3aed)' : 'var(--bg-card)', border: '1px solid', borderColor: msg.role === 'user' ? 'transparent' : 'var(--border-color)', boxShadow: msg.role === 'user' ? '0 10px 25px -10px rgba(139, 92, 246, 0.5)' : 'none' }}>
              {msg.isTyping ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Loader size={18} className="animate-spin" />
                  <span>{typingStatus}</span>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#fff', whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
                  {renderContentPreview(msg.data, msg.action || '')}
                  {msg.next_suggestion && (
                    <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)', fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>
                      💡 <strong>Próximo Passo:</strong> {msg.next_suggestion}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if(input.trim()) { setInput(''); sendToAgent(input); } }} style={{ marginTop: '1.5rem', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Tema para o pipeline editorial..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '1rem', padding: '0.8rem 1.2rem' }} />
        <button type="submit" className="btn-primary" style={{ borderRadius: '16px', width: '48px', height: '48px', padding: 0 }}><Send size={22} /></button>
      </form>
    </div>
  );
}

function EditorialReport({ data }: { data: any }) {
  return (
    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {data.reports?.map((report: any, idx: number) => (
        <div key={idx} className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{report.title}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: report.viral_score >= 8 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid', borderColor: report.viral_score >= 8 ? '#22c55e' : 'rgba(255,255,255,0.1)' }}>
              <TrendingUp size={14} color={report.viral_score >= 8 ? '#22c55e' : '#fff'} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: report.viral_score >= 8 ? '#22c55e' : '#fff' }}>{report.viral_score}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.8rem' }}>{report.summary}</p>
             <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '10px', borderLeft: '3px solid var(--accent-color)' }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600, margin: 0 }}>💡 IMPACTO NO NEGÓCIO:</p>
               <p style={{ fontSize: '0.8rem', color: '#fff', margin: '0.2rem 0 0 0' }}>{report.impact}</p>
             </div>
          </div>

          <div>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
               <Target size={14} /> Ideias de Conteúdo
             </p>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
               {report.content_ideas?.map((idea: string, i: number) => (
                 <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' }}>
                   {idea}
                 </div>
               ))}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MultiChannelPreview({ data, onSave, onSaveAll, onLike }: { data: any, onSave: (p: string, c: any) => void, onSaveAll: (platforms: any[]) => void, onLike: (p: string, topic: string, sample: any) => void }) {
  const [activeTab, setActiveTab] = useState('linkedin');
  const [currentSlide, setCurrentSlide] = useState(0);

  const tabs = [
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'twitter', label: 'Twitter/X' }
  ];

  const content = data[activeTab];

  const handleSaveAll = () => {
    const platforms = tabs.map(t => ({ id: t.id, content: data[t.id] })).filter(p => p.content);
    onSaveAll(platforms);
  };

  return (
    <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '1rem 0', background: 'transparent', border: 'none', color: activeTab === t.id ? 'var(--accent-color)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, borderBottom: activeTab === t.id ? '2px solid var(--accent-color)' : 'none', cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {activeTab === 'instagram' && content?.slides ? (
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', borderRadius: '16px', padding: '1.5rem' }}>
               <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{content.slides[currentSlide]}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button disabled={currentSlide === 0} onClick={() => setCurrentSlide(s => s - 1)} className="btn-ghost" style={{ padding: '0.4rem' }}><ChevronLeft size={16}/></button>
              <span style={{ fontSize: '0.8rem', alignSelf: 'center' }}>{currentSlide + 1} / {content.slides.length}</span>
              <button disabled={currentSlide === content.slides.length - 1} onClick={() => setCurrentSlide(s => s + 1)} className="btn-ghost" style={{ padding: '0.4rem' }}><ChevronRight size={16}/></button>
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '16px', fontSize: '0.9rem', color: '#fff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {content?.text || content?.script || 'Conteúdo não gerado para esta rede.'}
          </div>
        )}

        {content?.suggestion && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '10px', border: '1px dashed #22c55e', color: '#22c55e', fontSize: '0.75rem' }}>
             🚀 <strong>Sugestão:</strong> {content.suggestion}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button onClick={() => onSave(activeTab, content)} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', borderRadius: '12px' }}>
              <CheckCircle size={14}/> Salvar apenas {activeTab}
            </button>
            <button onClick={() => onLike(activeTab, 'Flywheel Gen', content)} className="btn-ghost" style={{ padding: '0.75rem', borderRadius: '12px' }}>
              <ThumbsUp size={16}/>
            </button>
          </div>
          
          <button onClick={handleSaveAll} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', marginBottom: '0.8rem' }}>
            🚀 SALVAR KIT COMPLETO (Todas as redes)
          </button>

          <button 
            onClick={() => onSave('blog', content)} 
            className="btn-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#60a5fa', cursor: 'pointer' }}
          >
            <Globe size={16}/> PUBLICAR NO BLOG PÚBLICO (SEO)
          </button>
        </div>
      </div>
    </div>
  );
}
