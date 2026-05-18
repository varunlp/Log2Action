import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Loader2, X, FileText, Send } from 'lucide-react';

const LOG_LOADING = ["Parsing log structure...", "Querying pgvector for context...", "Analyzing with AI...", "Synthesizing report..."];
const KB_LOADING = ["Searching knowledge base...", "Retrieving documents...", "Cross-referencing runbooks...", "Generating answer..."];

export default function UploadZone({ onSubmit, onUploadFile, isAnalyzing, mode }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);

  const loadingMessages = mode === 'log_analysis' ? LOG_LOADING : KB_LOADING;

  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => { setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length); }, 2200);
    return () => clearInterval(interval);
  }, [isAnalyzing, loadingMessages]);

  const handleFileChange = (e) => { if (e.target.files?.length) setFile(e.target.files[0]); };
  const removeFile = () => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleProcess = () => {
    if (isAnalyzing) return;
    if (file) { onUploadFile(file); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
    else if (text.trim()) { onSubmit(text); setText(''); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleProcess(); } };

  const hasInput = !!file || text.trim().length > 0;
  const placeholder = mode === 'log_analysis' ? "Paste logs, stack traces, or attach a log file..." : "Ask about your runbooks, SOPs, or procedures...";
  const fileAccept = mode === 'log_analysis' ? ".log,.txt" : ".log,.txt,.pdf,.docx,.md";

  const accentColor = mode === 'log_analysis' ? '#0ea5e9' : '#8b5cf6';

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: `1.5px solid ${isFocused ? accentColor : 'var(--border)'}`,
        borderRadius: '14px',
        boxShadow: isFocused ? `0 0 0 3px ${accentColor}15` : '0 1px 6px rgba(0,0,0,0.03)',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', minHeight: '100px'
      }}>
        <AnimatePresence>
          {file && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{
              position: 'absolute', top: '0.65rem', left: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: '8px',
              fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', zIndex: 2
            }}>
              <FileText size={12} color={accentColor} />
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              <button onClick={removeFile} disabled={isAnalyzing} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.1rem', display: 'flex', color: 'var(--text-tertiary)' }}>
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown} placeholder={placeholder} disabled={isAnalyzing} rows={2}
          style={{
            width: '100%', flex: 1, background: 'transparent', border: 'none',
            padding: file ? '2.5rem 0.85rem 2.5rem 0.85rem' : '0.85rem 0.85rem 2.5rem 0.85rem',
            fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)', resize: 'none', outline: 'none'
          }}
        />

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', background: 'transparent' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept={fileAccept} />
          <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} style={{
            color: 'var(--text-tertiary)', background: 'transparent', padding: '0.35rem', border: 'none',
            cursor: 'pointer', borderRadius: '7px', display: 'flex', alignItems: 'center', transition: 'color 0.2s ease'
          }} title="Attach file">
            <Paperclip size={16} />
          </button>
          <button onClick={handleProcess} disabled={!hasInput || isAnalyzing} style={{
            borderRadius: '50px', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.78rem', fontWeight: 600, opacity: (!hasInput || isAnalyzing) ? 0.35 : 1,
            background: hasInput ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : 'var(--bg-elevated)',
            color: hasInput ? '#fff' : 'var(--text-tertiary)',
            border: hasInput ? 'none' : '1px solid var(--border)',
            cursor: (!hasInput || isAnalyzing) ? 'default' : 'pointer',
            boxShadow: hasInput ? `0 2px 10px ${accentColor}25` : 'none',
            transition: 'all 0.25s ease'
          }}>
            {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {isAnalyzing ? 'Analyzing...' : 'Send'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{
            marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: accentColor, fontSize: '0.78rem', fontWeight: 500, paddingLeft: '0.4rem'
          }}>
            <Loader2 size={12} className="animate-spin" />
            <AnimatePresence mode="wait">
              <motion.span key={loadingMsgIdx} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}>
                {loadingMessages[loadingMsgIdx]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
