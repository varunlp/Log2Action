import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Lock, Mail, AlertCircle, CheckCircle, ArrowRight, Terminal } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { getApiErrorMessage } from '../utils/errors';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordRules = [
    { label: '10+ characters', valid: password.length >= 10 },
    { label: 'uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'number', valid: /\d/.test(password) },
  ];
  const passwordIsValid = passwordRules.every((rule) => rule.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!passwordIsValid) {
      setError('Password must include 10+ characters, uppercase, lowercase, and a number.');
      return;
    }
    setLoading(true);
    try {
      const createdUser = await register(email, password);
      setSuccess(
        createdUser?.is_admin && createdUser?.is_approved
          ? 'Admin account created. Sign in with these credentials.'
          : 'Request submitted. An admin will approve your access shortly.'
      );
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to register'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-orb" style={{ width: 300, height: 300, background: '#10b981', top: '-10%', right: '10%' }} />
      <div className="ambient-orb" style={{ width: 250, height: 250, background: '#8b5cf6', bottom: '10%', left: '5%' }} />

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '9px', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
        </Link>
        <ThemeToggle />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="card"
          style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.8rem', borderRadius: '16px', marginBottom: '1rem', background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 4px 16px rgba(16,185,129,0.2)' }}>
              <UserPlus size={26} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.35rem' }}>Request access</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Your account requires admin approval</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: '0.88rem' }}>
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)', fontSize: '0.88rem' }}>
              <CheckCircle size={16} /> {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', top: '50%', left: '0.85rem', transform: 'translateY(-50%)' }} />
              <input type="password" placeholder="Password (10+ chars, Aa1)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 0.75rem', fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
              {passwordRules.map((rule) => (
                <span key={rule.label} style={{ color: rule.valid ? 'var(--success)' : 'var(--text-tertiary)' }}>
                  {rule.valid ? '✓' : '•'} {rule.label}
                </span>
              ))}
            </div>
            <button type="submit" className="btn-primary" disabled={loading || success || !passwordIsValid} style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem', background: success ? 'var(--success)' : '', opacity: (!passwordIsValid || loading || success) ? 0.65 : 1 }}>
              {loading ? 'Submitting...' : success ? 'Request sent ✓' : 'Request access'} {!success && <ArrowRight size={15} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Already approved? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
