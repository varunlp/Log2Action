import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Sparkles, Loader2, X, FileText } from 'lucide-react';

const LOADING_MESSAGES = [
  "Parsing log structure...",
  "Querying pgvector for runbook context...",
  "Analyzing with AI...",
  "Synthesizing intelligence report..."
];

export default function UploadZone({ onUploadFile, onAnalyzeText, isAnalyzing }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = () => {
    if (isAnalyzing) return;
    if (file) {
      onUploadFile(file);
    } else if (text.trim()) {
      onAnalyzeText(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  const hasInput = !!file || text.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', margin: '0 auto' }}>
      <div 
        style={{
          position: 'relative',
          background: 'var(--bg-primary)',
          border: `1px solid ${isFocused ? 'var(--accent)' : 'var(--border-subtle)'}`,
          borderRadius: '16px',
          boxShadow: isFocused ? '0 0 0 4px rgba(232,116,97,0.1)' : '0 4px 20px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '140px'
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Paste log snippets, describe your issue, or attach a file..."
          disabled={isAnalyzing}
          style={{
            width: '100%',
            flex: 1,
            background: 'transparent',
            border: 'none',
            padding: '1.25rem 1.25rem 3rem 1.25rem',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            resize: 'none',
            outline: 'none'
          }}
        />

        {/* Attached File Pill */}
        <AnimatePresence>
          {file && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <FileText size={14} color="var(--accent)" />
              <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <button 
                onClick={removeFile}
                disabled={isAnalyzing}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', marginLeft: '0.2rem' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Action Bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'transparent' }}>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".log,.txt" />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="btn-icon"
            style={{ color: 'var(--text-tertiary)', background: 'transparent', padding: '0.5rem', border: 'none' }}
            title="Attach log file"
          >
            <Paperclip size={20} />
          </button>

          <button 
            onClick={handleProcess}
            disabled={!hasInput || isAnalyzing}
            className="btn-primary"
            style={{ 
              borderRadius: '50px', 
              padding: '0.5rem 1.25rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              opacity: (!hasInput || isAnalyzing) ? 0.5 : 1,
              background: hasInput ? 'var(--accent)' : 'var(--bg-secondary)',
              color: hasInput ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              border: hasInput ? 'none' : '1px solid var(--border)'
            }}
          >
            {isAnalyzing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Loading Status Indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 500, padding: '0 1rem' }}
          >
            <Loader2 size={14} className="animate-spin" />
            <AnimatePresence mode="wait">
              <motion.span key={loadingMsgIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                {LOADING_MESSAGES[loadingMsgIdx]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
