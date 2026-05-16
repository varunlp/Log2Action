import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, ShieldAlert, Settings, LogOut, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import UploadZone from '../components/UploadZone';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

/* ── Severity badge helper ── */
const SeverityBadge = ({ severity }) => {
  const cls = (() => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': case 'ERROR': return 'badge-error';
      case 'WARNING': return 'badge-accent';
      default: return 'badge-success';
    }
  })();
  return <span className={`badge ${cls}`}>{severity || '—'}</span>;
};

/* ── Analysis result card ── */
const AnalysisResult = ({ result, onReset }) => {
  const a = result.analysis || {};
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="var(--accent)" /> Intelligence Report
        </h2>
        <SeverityBadge severity={a.severity} />
      </div>
      <Section label="Summary" text={a.issue_summary} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <Section label="Root Cause" text={a.root_cause} secondary />
        <Section label="Remediation" text={a.remediation} color="var(--success)" />
      </div>
      <button onClick={onReset} className="btn-secondary" style={{ width: '100%' }}>Analyze another log</button>
    </motion.div>
  );
};

const Section = ({ label, text, secondary, color }) => (
  <div style={{ marginBottom: secondary ? 0 : '1.5rem' }}>
    <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>{label}</label>
    <p style={{ marginTop: '0.3rem', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: color || (secondary ? 'var(--text-secondary)' : 'var(--text-primary)') }}>{text || '—'}</p>
  </div>
);

/* ── Expandable history item ── */
const HistoryItem = ({ item, isLast }) => {
  const [open, setOpen] = useState(false);
  const a = item.analysis;
  const time = item.created_at ? new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: 'transparent', borderRadius: 0, color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
          <FileText size={16} color="var(--text-tertiary)" />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.filename}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{time}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {a && <SeverityBadge severity={a.severity} />}
          {open ? <ChevronUp size={16} color="var(--text-tertiary)" /> : <ChevronDown size={16} color="var(--text-tertiary)" />}
        </div>
      </button>
      <AnimatePresence>
        {open && a && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', padding: '0 1.25rem 1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Summary</strong>
                <p style={{ marginTop: '0.2rem' }}>{a.issue_summary}</p>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Root Cause</strong>
                <p style={{ marginTop: '0.2rem', color: 'var(--text-secondary)' }}>{a.root_cause || '—'}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Fix</strong>
                <p style={{ marginTop: '0.2rem', color: 'var(--success)' }}>{a.remediation || '—'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


/* ═══════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════ */
export default function Dashboard() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/logs/history?limit=8');
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleUpload = async (file) => {
    try {
      setErrorMsg(null);
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('http://localhost:8000/api/v1/logs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysisResult(response.data);
      fetchHistory(); // refresh history after new upload
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "An error occurred during analysis.");
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => { setAnalysisResult(null); setErrorMsg(null); };

  return (
    <div style={{ minHeight: '100vh' }}>
      
      {/* ─── Nav ─── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={22} color="var(--accent)" strokeWidth={2.5} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>{user?.email}</span>
          <ThemeToggle />
          {user?.is_admin && (
            <button onClick={() => navigate('/admin')} className="btn-icon" title="Admin console"><Settings size={18} /></button>
          )}
          <button onClick={logout} className="btn-icon" title="Sign out"><LogOut size={18} /></button>
        </div>
      </nav>

      {/* ─── Content: Two-column on large, stacked on small ─── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* LEFT: Upload + Result */}
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Log Analysis <span className="accent-text">Console</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Upload a log file — AI will diagnose it using your knowledge base.
            </p>
          </div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(217,79,79,0.08)', border: '1px solid rgba(217,79,79,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontSize: '0.9rem' }}>
              <ShieldAlert size={18} /> {errorMsg}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!analysisResult ? (
              <UploadZone key="upload" onUpload={handleUpload} isAnalyzing={isAnalyzing} />
            ) : (
              <AnalysisResult key="result" result={analysisResult} onReset={handleReset} />
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: History sidebar */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--accent)" /> Recent analyses
          </h3>
          <div className="card" style={{ overflow: 'hidden' }}>
            {historyLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                No analyses yet. Upload your first log!
              </div>
            ) : (
              history.map((item, i) => (
                <HistoryItem key={item.id} item={item} isLast={i === history.length - 1} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
