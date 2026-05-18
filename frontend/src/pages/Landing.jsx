import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Zap, Database, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const FeatureCard = ({ icon, title, desc, delay, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="card card-3d"
    style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', borderRadius: 8 }}
  >
    {/* Subtle gradient accent line at top */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
      background: `linear-gradient(90deg, ${color}, transparent)`
    }} />
    <div style={{
      width: 40, height: 40, borderRadius: 8, marginBottom: '1rem',
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
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--gradient-surface)' }}>

      {/* ─── Navbar ─── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2.5rem', maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
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
      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '4.5rem 2rem 3rem', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          <div className="landing-hero-grid">
            <div>
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
                  <Sparkles size={13} /> AI log analysis with runbook retrieval
                </span>
              </motion.div>

              <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.05, maxWidth: 660 }}>
                LOG2ACTION
              </h1>

              <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)', maxWidth: '560px', marginBottom: '2rem', lineHeight: 1.7 }}>
                Turn uploaded logs, stack traces, runbooks, and SOPs into structured incident analysis with source-backed recommendations for operations teams.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', borderRadius: 8 }}>
                  Start analyzing <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', borderRadius: 8 }}>
                  Sign in
                </button>
              </div>
            </div>

            <div className="card" style={{ borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={15} color="var(--accent)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Incident analysis</span>
              </div>
              <div style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                {[
                  ['Severity', 'CRITICAL', 'var(--error)'],
                  ['Signal', 'Database connection pool exhausted', 'var(--text-primary)'],
                  ['Likely cause', 'Connection leak after deploy v42', 'var(--text-primary)'],
                  ['Runbook match', 'Pool recovery SOP, section 3', 'var(--accent)'],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                    <span style={{ color, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Feature Cards ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '5rem', textAlign: 'left' }}>
          <FeatureCard icon={<Zap size={20} />} title="Structured diagnosis" desc="Convert noisy logs into severity, root cause, and remediation fields." delay={0.3} color="#0ea5e9" />
          <FeatureCard icon={<Database size={20} />} title="Knowledge retrieval" desc="Search uploaded runbooks and SOPs with pgvector-backed context." delay={0.4} color="#8b5cf6" />
          <FeatureCard icon={<ShieldCheck size={20} />} title="Controlled access" desc="Use approved accounts, admin review, scoped user data, and explicit cloud origins." delay={0.5} color="#10b981" />
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
