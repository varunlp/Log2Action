import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Zap, Database, ShieldCheck, ArrowRight, Waves, BookOpen, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const FeatureCard = ({ icon, title, desc, delay, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="card card-3d"
    style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}
  >
    {/* Subtle gradient accent line at top */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
      background: `linear-gradient(90deg, ${color}, transparent)`
    }} />
    <div style={{
      width: 40, height: 40, borderRadius: '12px', marginBottom: '1rem',
      background: `${color}12`, border: `1px solid ${color}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55 }}>{desc}</p>
  </motion.div>
);

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient floating orbs */}
      <div className="ambient-orb" style={{ width: 400, height: 400, background: 'var(--accent)', top: '-10%', right: '-5%' }} />
      <div className="ambient-orb" style={{ width: 300, height: 300, background: 'var(--accent-2)', bottom: '10%', left: '-5%' }} />
      <div className="ambient-orb" style={{ width: 200, height: 200, background: 'var(--accent-3)', top: '50%', right: '20%' }} />

      {/* ─── Navbar ─── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Terminal size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <ThemeToggle />
          <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>Sign in</Link>
          <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
            Get started <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'inline-flex', marginBottom: '1.75rem' }}
          >
            <span className="badge" style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
              padding: '0.35rem 0.85rem', fontSize: '0.78rem'
            }}>
              <Sparkles size={13} /> Powered by AI + pgvector RAG
            </span>
          </motion.div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-2px', marginBottom: '1.5rem', lineHeight: 1.05 }}>
            From raw logs to<br />
            <span className="accent-text">root cause in seconds.</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Upload logs or ask questions. The AI queries your internal runbooks, traces the stack, and delivers the exact fix. No more guessing.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}>
              Start analyzing <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}>
              Sign in
            </button>
          </div>
        </motion.div>

        {/* ─── Feature Cards ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '5rem', textAlign: 'left' }}>
          <FeatureCard icon={<Zap size={20} />} title="Instant diagnosis" desc="AI traces through your logs and pinpoints the exact failure in seconds." delay={0.3} color="#0ea5e9" />
          <FeatureCard icon={<Database size={20} />} title="RAG knowledge base" desc="Embed runbooks & SOPs into pgvector. AI retrieves context automatically." delay={0.4} color="#8b5cf6" />
          <FeatureCard icon={<ShieldCheck size={20} />} title="Enterprise security" desc="Role-based auth with admin approval. Production-grade from day one." delay={0.5} color="#10b981" />
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer style={{
        textAlign: 'center', padding: '3rem 2rem 2rem',
        color: 'var(--text-tertiary)', fontSize: '0.82rem',
        borderTop: '1px solid var(--border-subtle)',
        maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1
      }}>
        LOG2ACTION · AI Operational Intelligence Platform
      </footer>
    </div>
  );
}
