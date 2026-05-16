import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';

const LOADING_MESSAGES = [
  "Parsing log structure...",
  "Querying pgvector for runbook context...",
  "Analyzing with Gemini AI...",
  "Synthesizing intelligence report..."
];

export default function UploadZone({ onUpload, isAnalyzing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => { if (e.target.files?.length) setFile(e.target.files[0]); };
  const handleProcess = () => { if (file) onUpload(file); };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      
      <div
        className="card"
        onClick={() => !isAnalyzing && fileInputRef.current.click()}
        onDragOver={isAnalyzing ? undefined : handleDragOver}
        onDragLeave={isAnalyzing ? undefined : handleDragLeave}
        onDrop={isAnalyzing ? undefined : handleDrop}
        style={{
          width: '100%', padding: '3rem 2rem', textAlign: 'center',
          cursor: isAnalyzing ? 'default' : 'pointer',
          borderColor: isDragging ? 'var(--accent)' : '',
          borderStyle: isDragging ? 'dashed' : 'solid'
        }}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".log,.txt" />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <UploadCloud size={40} color="var(--text-tertiary)" strokeWidth={1.5} />
              <p style={{ fontWeight: 500, fontSize: '1rem' }}>Drop a log file here</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>or click to browse · .log, .txt</p>
            </motion.div>
          ) : (
            <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={40} color="var(--accent)" strokeWidth={1.5} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>{file.name}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{(file.size / 1024).toFixed(1)} KB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {file && !isAnalyzing && (
          <motion.div key="btn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: '1.25rem' }}>
            <button onClick={handleProcess} className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}>
              Analyze with AI
            </button>
          </motion.div>
        )}
        {isAnalyzing && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Loader2 size={16} className="animate-spin" />
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
