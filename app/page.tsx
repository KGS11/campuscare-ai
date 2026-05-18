'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ChatMessage {
  role: 'user' | 'ai' | 'error';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [s
  { icon: '📚', label: 'Library Hours', prompt: 'What are the library hours?' },
  { icon: '🍽️', label: 'Mess Menu', prompt: 'What is today\'s mess menu?' },
  { icon: '📅', label: 'Events', prompt: 'What events are happening this week?' },
  { icon: '📝', label: 'Exam Schedule', prompt: 'When are the upcoming exams?' },
];

export default function Home() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    setLoginError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
    } else {
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      setLoginLoading(false);
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
  };

  // SIGNUP
  const handleSignup = async () => {
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    setLoginError('');

    const { error } = await supabase.auth.signUp({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError(error.message);
    } else {
      setLoginError('');
      alert('Check your email for the confirmation link!');
    }
    setLoginLoading(false);
  };

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setChat([]);
  };

  // SEND MESSAGE
  const sendMessage = async (text?: string) => {
    const msg = text || message;
    if (msg.trim() === '' || loading) return;

    if (!user) {
      setShowLogin(true);
      return;
    }

    const userMessage = msg.trim();
    setChat((prev) => [...prev, { role: 'user', text: userMessage, timestamp: new Date() }]);
    setMessage('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      // Save to Supabase
      await supabase.from('queries').insert([
        {
          user_id: user.id,
          question: userMessage,
          answer: data.reply,
        },
      ]);

      setChat((prev) => [...prev, { role: 'ai', text: data.reply, timestamp: new Date() }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: 'error', text: 'Something went wrong. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.wrapper}>
      {/* Background decorations */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />

      <div style={styles.container}>
        {/* ====== HEADER ====== */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoCircle}>
              <span style={{ fontSize: '1.5rem' }}>🎓</span>
            </div>
            <div>
              <h1 style={styles.title}>CampusCare AI</h1>
              <p style={styles.subtitle}>
                <span style={styles.statusDot} />
                Online — Ready to help
              </p>
            </div>
          </div>
          <div style={styles.headerRight}>
            {user ? (
              <div style={styles.userArea}>
                <div style={styles.avatar}>
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span style={styles.userEmail}>{user.email}</span>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} style={styles.loginBtn}>
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* ====== CHAT AREA ====== */}
        <div style={styles.chatArea}>
          {chat.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎓</div>
              <h2 style={styles.emptyTitle}>Welcome to CampusCare AI</h2>
              <p style={styles.emptyDesc}>
                Your intelligent campus companion. Ask me anything about campus life!
              </p>
              <div style={styles.quickPrompts}>
                {QUICK_PROMPTS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.prompt)}
                    style={styles.quickBtn}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = 'rgba(99, 102, 241, 0.2)';
                      (e.target as HTMLElement).style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = 'rgba(30, 41, 59, 0.6)';
                      (e.target as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.15)';
                      (e.target as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{q.icon}</span>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chat.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: msg.role === 'user' ? 'slideInRight 0.3s ease' : 'slideInLeft 0.3s ease',
                }}
              >
                {msg.role !== 'user' && (
                  <div
                    style={{
                      ...styles.msgAvatar,
                      background: msg.role === 'error'
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    }}
                  >
                    {msg.role === 'error' ? '⚠' : '🤖'}
                  </div>
                )}
                <div
                  style={{
                    ...styles.bubble,
                    ...(msg.role === 'user'
                      ? styles.userBubble
                      : msg.role === 'error'
                        ? styles.errorBubble
                        : styles.aiBubble),
                  }}
                >
                  <p style={styles.bubbleText}>{msg.text}</p>
                  <span style={styles.timestamp}>{formatTime(msg.timestamp)}</span>
                </div>
                {msg.role === 'user' && (
                  <div
                    style={{
                      ...styles.msgAvatar,
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    }}
                  >
                    {user?.email?.[0]?.toUpperCase() || '👤'}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: 'flex-start', animation: 'slideInLeft 0.3s ease' }}>
              <div style={{ ...styles.msgAvatar, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                🤖
              </div>
              <div style={{ ...styles.bubble, ...styles.aiBubble }}>
                <div style={styles.typingDots}>
                  <span style={{ ...styles.dot, animationDelay: '0s' }} />
                  <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                  <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ====== INPUT ====== */}
        <div style={styles.inputArea}>
          <div style={styles.inputWrapper}>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={user ? 'Ask me anything about campus...' : 'Sign in to start chatting...'}
              style={styles.input}
              disabled={loading || !user}
            />
            <button
              id="send-button"
              onClick={() => sendMessage()}
              style={{
                ...styles.sendBtn,
                ...(loading || message.trim() === '' ? styles.sendBtnDisabled : {}),
              }}
              disabled={loading || message.trim() === ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p style={styles.disclaimer}>
            CampusCare AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>

      {/* ====== LOGIN MODAL ====== */}
      {showLogin && (
        <div style={styles.modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowLogin(false)} style={styles.modalClose}>
              ✕
            </button>
            <div style={styles.modalHeader}>
              <div style={{ ...styles.logoCircle, width: 56, height: 56 }}>
                <span style={{ fontSize: '1.75rem' }}>🎓</span>
              </div>
              <h2 style={styles.modalTitle}>Welcome Back</h2>
              <p style={styles.modalSubtitle}>Sign in to CampusCare AI</p>
            </div>
            <form onSubmit={handleLogin} style={styles.form}>
              {loginError && <div style={styles.formError}>{loginError}</div>}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@campus.edu"
                  style={styles.formInput}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.formInput}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  ...styles.formSubmitBtn,
                  opacity: loginLoading ? 0.6 : 1,
                }}
                disabled={loginLoading}
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleSignup}
                style={styles.formSecondaryBtn}
                disabled={loginLoading}
              >
                Don't have an account? <strong>Sign Up</strong>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================
//          STYLES
// ============================
const styles: Record<string, React.CSSProperties> = {
  // ── Wrapper & Background ──
  wrapper: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #0c1222 0%, #0f172a 40%, #131c31 100%)',
  },
  bgOrb1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
    top: -150,
    right: -100,
    pointerEvents: 'none',
    animation: 'float 8s ease-in-out infinite',
  },
  bgOrb2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
    bottom: -100,
    left: -100,
    pointerEvents: 'none',
    animation: 'float 10s ease-in-out infinite reverse',
  },
  bgOrb3: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
    top: '40%',
    left: '50%',
    pointerEvents: 'none',
    animation: 'float 12s ease-in-out infinite',
  },

  // ── Main Container ──
  container: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 820,
    height: '100vh',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
  },

  // ── Header ──
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
    border: '1px solid rgba(99,102,241,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#22c55e',
    display: 'inline-block',
    boxShadow: '0 0 6px rgba(34,197,94,0.5)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  userEmail: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    padding: '0.35rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loginBtn: {
    padding: '0.5rem 1.25rem',
    borderRadius: 10,
    border: '1px solid rgba(99,102,241,0.3)',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
    color: '#a5b4fc',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // ── Chat Area ──
  chatArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  // ── Empty State ──
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    animation: 'fadeInUp 0.5s ease',
  },
  emptyIcon: {
    fontSize: '3.5rem',
    marginBottom: '0.5rem',
    animation: 'float 4s ease-in-out infinite',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  emptyDesc: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
    maxWidth: 360,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  quickPrompts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.625rem',
    marginTop: '1.5rem',
    width: '100%',
    maxWidth: 420,
  },
  quickBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.15)',
    background: 'rgba(30, 41, 59, 0.6)',
    color: '#cbd5e1',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
  },

  // ── Messages ──
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.5rem',
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '70%',
    padding: '0.875rem 1rem',
    borderRadius: 16,
    position: 'relative' as const,
  },
  userBubble: {
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff',
    borderBottomRightRadius: 4,
    boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
  },
  aiBubble: {
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#e2e8f0',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  timestamp: {
    display: 'block',
    fontSize: '0.65rem',
    color: 'rgba(148,163,184,0.5)',
    marginTop: '0.375rem',
    textAlign: 'right' as const,
  },

  // ── Typing Indicator ──
  typingDots: {
    display: 'flex',
    gap: 5,
    padding: '0.25rem 0',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#6366f1',
    display: 'inline-block',
    animation: 'dotPulse 1.4s ease-in-out infinite',
  },

  // ── Input Area ──
  inputArea: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid rgba(148, 163, 184, 0.08)',
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    background: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: 16,
    padding: '0.375rem 0.375rem 0.375rem 1.125rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  input: {
    flex: 1,
    padding: '0.75rem 0',
    border: 'none',
    background: 'transparent',
    color: '#f1f5f9',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  disclaimer: {
    margin: '0.5rem 0 0',
    fontSize: '0.65rem',
    color: '#475569',
    textAlign: 'center',
  },

  // ── Login Modal ──
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 100,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeInUp 0.2s ease',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    background: 'linear-gradient(145deg, #1e293b, #0f172a)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 24,
    padding: '2rem',
    position: 'relative' as const,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  modalClose: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: 'rgba(148,163,184,0.1)',
    color: '#94a3b8',
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.375rem',
    fontWeight: 700,
    color: '#f1f5f9',
  },
  modalSubtitle: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formError: {
    padding: '0.625rem 0.875rem',
    borderRadius: 10,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    fontSize: '0.8rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#94a3b8',
  },
  formInput: {
    padding: '0.75rem 1rem',
    borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.15)',
    background: 'rgba(15, 23, 42, 0.6)',
    color: '#f1f5f9',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  formSubmitBtn: {
    padding: '0.875rem',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
    marginTop: '0.25rem',
  },
  formSecondaryBtn: {
    padding: '0.625rem',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'center',
  },
};