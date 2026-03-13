import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../config/supabase';
import { User, Mail, Lock, Save } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export default function Profile() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (error) addNotification('error', error.message);
    else addNotification('success', 'Nome atualizado com sucesso!');
    setLoading(false);
  };

  const handleUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (newEmail === user?.email) {
      addNotification('error', 'O email é o mesmo do atual.');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) addNotification('error', error.message);
    else addNotification('success', 'Email de confirmação enviado para o novo endereço!');
    setLoading(false);
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addNotification('error', 'As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      addNotification('error', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) addNotification('error', error.message);
    else {
      addNotification('success', 'Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const sectionStyle = {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '1.5rem 2rem',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '1.5rem'
  };

  const inputContainerStyle = {
    display: 'flex' as const, alignItems: 'center' as const, gap: '0.7rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '0 1rem',
    marginBottom: '1rem'
  };

  const inputStyle = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#fff', padding: '0.8rem 0', fontSize: '0.9rem'
  };

  const labelStyle = {
    display: 'block' as const, fontSize: '0.8rem', color: 'var(--text-muted)',
    marginBottom: '0.5rem', fontWeight: 500 as const
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <h1>Meu Perfil</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Gerencie suas informações pessoais e segurança.</p>

      {/* Avatar + Info */}
      <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--accent-color), #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 700, color: '#fff', flexShrink: 0
        }}>
          {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 style={{ color: '#fff', marginBottom: '0.2rem' }}>{displayName || 'Sem nome'}</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{user?.email}</p>
        </div>
      </div>

      {/* Nome */}
      <div style={sectionStyle}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} /> Informações Pessoais
        </h3>
        <form onSubmit={handleUpdateProfile}>
          <label style={labelStyle}>Nome de Exibição</label>
          <div style={inputContainerStyle}>
            <User size={16} color="var(--text-muted)" />
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Seu nome" style={inputStyle} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.7rem 1.5rem' }}>
            <Save size={16} /> Salvar Nome
          </button>
        </form>
      </div>

      {/* Email */}
      <div style={sectionStyle}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={18} /> Alterar Email
        </h3>
        <form onSubmit={handleUpdateEmail}>
          <label style={labelStyle}>Novo Email</label>
          <div style={inputContainerStyle}>
            <Mail size={16} color="var(--text-muted)" />
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="novo@email.com" style={inputStyle} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.7rem 1.5rem' }}>
            <Save size={16} /> Atualizar Email
          </button>
        </form>
      </div>

      {/* Senha */}
      <div style={sectionStyle}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} /> Alterar Senha
        </h3>
        <form onSubmit={handleUpdatePassword}>
          <label style={labelStyle}>Nova Senha</label>
          <div style={inputContainerStyle}>
            <Lock size={16} color="var(--text-muted)" />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
          <label style={labelStyle}>Confirmar Senha</label>
          <div style={inputContainerStyle}>
            <Lock size={16} color="var(--text-muted)" />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.7rem 1.5rem' }}>
            <Save size={16} /> Atualizar Senha
          </button>
        </form>
      </div>
    </div>
  );
}
