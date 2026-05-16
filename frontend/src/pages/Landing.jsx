import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Zap, Database, ShieldCheck, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ─── Navbar ─── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={22} color="var(--accent)" strokeWidth={2.5} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <ThemeToggle />
          <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>Sign in</Link>
          <button onClick={() => navigate('/register')} className="btn-primary">Get started</button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          
          <span className="badge badge-accent" style={{ marginBottom: '1.5rem' }}>
            Powered by Gemini AI + pgvector RAG
          </span>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            From raw logs to<br/><span className="accent-text">root cause in seconds.</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Upload logs. The AI queries your internal runbooks, traces the stack, and delivers the exact fix. No more guessing.
          </p>
          
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Start analyzing <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Sign in
            </button>
          </div>
        </motion.div>

        {/* ─── Feature Cards ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '5rem', textAlign: 'left' }}>
          {[
            { icon: <Zap size={22} />, title: "Instant diagnosis", desc: "AI traces through your logs and pinpoints the exact failure." },
            { icon: <Database size={22} />, title: "RAG knowledge base", desc: "Embed runbooks into pgvector. The AI retrieves relevant context automatically." },
            { icon: <ShieldCheck size={22} />, title: "Admin access control", desc: "Role-based auth with admin approval. Enterprise-grade from day one." }
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i + 0.3 }} className="card" style={{ padding: '1.75rem' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer style={{ textAlign: 'center', padding: '3rem 2rem 2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem', borderTop: '1px solid var(--border-subtle)', maxWidth: '1200px', margin: '0 auto' }}>
        LOG2ACTION · AI Operational Intelligence Platform
      </footer>
    </div>
  );
}
