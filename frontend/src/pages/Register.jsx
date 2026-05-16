import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Lock, Mail, AlertCircle, CheckCircle, ArrowRight, Terminal } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password);
      setSuccess('Request submitted! An admin will approve your access shortly.');
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
          <Terminal size={22} color="var(--accent)" strokeWidth={2.5} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
        </Link>
        <ThemeToggle />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card"
          style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(45,157,120,0.08)', padding: '0.75rem', borderRadius: '14px', marginBottom: '1rem', border: '1px solid rgba(45,157,120,0.2)' }}>
              <UserPlus size={28} color="var(--success)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>Request access</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your account requires admin approval</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', background: 'rgba(217,79,79,0.08)', border: '1px solid rgba(217,79,79,0.2)', color: 'var(--error)', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', background: 'rgba(45,157,120,0.08)', border: '1px solid rgba(45,157,120,0.2)', color: 'var(--success)', fontSize: '0.9rem' }}>
              <CheckCircle size={18} /> {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ paddingLeft: '2.5rem' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || success} style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem', background: success ? 'var(--success)' : '' }}>
              {loading ? 'Submitting...' : success ? 'Request sent ✓' : 'Request access'} {!success && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Already approved? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
