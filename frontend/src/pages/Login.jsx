import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

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
      setError(err.response?.data?.detail || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Mini nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
          <Terminal size={22} color="var(--accent)" strokeWidth={2.5} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
        </Link>
        <ThemeToggle />
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card"
          style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', background: 'var(--accent-subtle)', padding: '0.75rem', borderRadius: '14px', marginBottom: '1rem', border: '1px solid var(--accent-border)' }}>
              <Terminal size={28} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to your console</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="badge-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', background: 'rgba(217,79,79,0.08)', border: '1px solid rgba(217,79,79,0.2)', color: 'var(--error)', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Need an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Request access</Link>
          </div>

          {/* Admin hint */}
          <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <strong style={{ color: 'var(--accent)' }}>Admin?</strong> Use your admin credentials to access the management console.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
