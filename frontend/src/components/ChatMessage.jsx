import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, BookOpen, Activity, Copy, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import SourceCitation from './SourceCitation';

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="btn-ghost" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', marginTop: '0.5rem' }}>
      {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const SeverityBadge = ({ severity }) => {
  const map = {
    CRITICAL: { cls: 'badge-error', icon: <AlertTriangle size={10} /> },
    ERROR: { cls: 'badge-error', icon: <AlertTriangle size={10} /> },
    WARNING: { cls: 'badge-accent', icon: null },
    INFO: { cls: 'badge-success', icon: null },
  };
  const s = map[severity?.toUpperCase()] || map.INFO;
  return <span className={`badge ${s.cls}`}>{s.icon} {severity || '—'}</span>;
};

const ConfidenceBadge = ({ confidence }) => {
  const cls = confidence === 'HIGH' ? 'badge-success' : confidence === 'LOW' ? 'badge-error' : 'badge-accent';
  return <span className={`badge ${cls}`}>{confidence}</span>;
};


export default function ChatMessage({ message, isUser }) {
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}
      >
        <div style={{
          maxWidth: '72%',
          padding: '0.8rem 1.1rem',
          borderRadius: '16px 16px 4px 16px',
          background: 'var(--gradient-brand)',
          color: '#fff',
          fontSize: '0.88rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: '0 2px 12px var(--accent-glow)'
        }}>
          {message.input_filename && (
            <div style={{ fontSize: '0.72rem', opacity: 0.85, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              📎 {message.input_filename}
            </div>
          )}
          {message.input_text}
        </div>
      </motion.div>
    );
  }

  const data = message.response_data || {};
  const isLogAnalysis = message.mode === 'log_analysis';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.25rem' }}
    >
      <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '85%', width: '100%' }}>
        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: '10px', flexShrink: 0, marginTop: '2px',
          background: isLogAnalysis
            ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)'
            : 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isLogAnalysis ? '0 2px 8px rgba(14,165,233,0.25)' : '0 2px 8px rgba(139,92,246,0.25)'
        }}>
          {isLogAnalysis ? <Terminal size={14} color="#fff" /> : <BookOpen size={14} color="#fff" />}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: '1.2rem', overflow: 'visible', position: 'relative' }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '16px 16px 0 0',
              background: isLogAnalysis
                ? 'linear-gradient(90deg, #0ea5e9, transparent)'
                : 'linear-gradient(90deg, #8b5cf6, transparent)'
            }} />

            {isLogAnalysis ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700 }}>
                    <Activity size={13} color="var(--accent)" /> Intelligence Report
                  </div>
                  <SeverityBadge severity={data.severity} />
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Summary</label>
                  <p style={{ marginTop: '0.15rem', fontSize: '0.86rem', lineHeight: 1.5 }}>{data.issue_summary || '—'}</p>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Root Cause</label>
                  <div style={{
                    marginTop: '0.25rem', padding: '0.7rem', borderRadius: '8px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)'
                  }}>
                    <p style={{ fontSize: '0.84rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>{data.root_cause || '—'}</p>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Remediation</label>
                    {data.remediation && <CopyBtn text={data.remediation} />}
                  </div>
                  <div style={{
                    marginTop: '0.25rem', padding: '0.7rem', borderRadius: '8px',
                    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)'
                  }}>
                    <p style={{ fontSize: '0.84rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--success)' }}>{data.remediation || '—'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <BookOpen size={13} color="var(--accent-2)" /> Answer
                  </div>
                  {data.confidence && <ConfidenceBadge confidence={data.confidence} />}
                </div>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                  {data.answer || '—'}
                </p>
                {data.answer && <CopyBtn text={data.answer} />}
              </>
            )}
          </div>

          <SourceCitation sources={message.sources} />
        </div>
      </div>
    </motion.div>
  );
}
