import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { getApiErrorMessage } from '../utils/errors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient orbs */}
      <div className="ambient-orb" style={{ width: 350, height: 350, background: 'var(--accent)', top: '-15%', left: '10%' }} />
      <div className="ambient-orb" style={{ width: 250, height: 250, background: 'var(--accent-2)', bottom: '5%', right: '5%' }} />

      {/* Mini nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '9px', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
        </Link>
        <ThemeToggle />
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="card"
          style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}
        >
          {/* Gradient top edge */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gradient-brand)' }} />

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex', padding: '0.8rem', borderRadius: '16px', marginBottom: '1rem',
              background: 'var(--gradient-brand)', boxShadow: '0 4px 16px var(--accent-glow)'
            }}>
              <Terminal size={26} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.35rem' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Sign in to your console</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem',
              borderRadius: '10px', marginBottom: '1.25rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)', fontSize: '0.88rem'
            }}>
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={15} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Need an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Request access</Link>
          </div>

          <div style={{
            marginTop: '1.5rem', padding: '0.7rem 1rem', borderRadius: '10px',
            background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
            fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center'
          }}>
            <strong style={{ color: 'var(--accent)' }}>Admin?</strong> Use your admin credentials to access the management console.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
