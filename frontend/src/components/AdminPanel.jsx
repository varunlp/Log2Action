import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Database, UploadCloud, Loader2 } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

export default function AdminPanel({ inline = false }) {
  const [isAuthenticated, setIsAuthenticated] = useState(inline);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('Incorrect passcode');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE}/api/v1/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage(`Success! Created ${response.data.chunks_created} vector chunks from ${response.data.filename}.`);
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage('Error uploading document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={inline ? { width: '100%' } : { position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
      {!isAuthenticated ? (
        <motion.div 
          className="glass-panel"
          style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Lock size={18} color="var(--text-secondary)" />
          <form onSubmit={handleLogin} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="password" 
              placeholder="Passcode..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', outline: 'none'
              }}
            />
            <button type="submit" style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
              Unlock
            </button>
          </form>
          {message && <span style={{ color: 'var(--error-color)', fontSize: '0.8rem' }}>{message}</span>}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel"
          style={{ padding: '1.5rem', width: '350px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
              <Database size={18} color="var(--accent-primary)" />
              Knowledge Base (RAG)
            </h3>
            {!inline && (
              <button onClick={() => setIsAuthenticated(false)} style={{ background: 'none', color: 'var(--text-secondary)' }}>
                <Unlock size={18} />
              </button>
            )}
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Upload internal runbooks. The AI will read these to help diagnose logs.
          </p>

          <div 
            onClick={() => fileInputRef.current.click()}
            style={{ 
              border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem 1rem', 
              textAlign: 'center', cursor: 'pointer', marginBottom: '1rem',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".txt,.md,.log" />
            {!file ? (
              <>
                <UploadCloud size={24} color="var(--accent-primary)" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.9rem' }}>Click to select runbook</div>
              </>
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'var(--success-color)' }}>{file.name} selected</div>
            )}
          </div>

          <button 
            className={file && !isUploading ? "primary" : ""}
            onClick={handleUpload}
            disabled={!file || isUploading}
            style={{ 
              width: '100%', padding: '0.75rem', 
              background: (!file || isUploading) ? 'var(--border-color)' : '', 
              color: (!file || isUploading) ? 'var(--text-secondary)' : '', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            {isUploading ? 'Vectorizing...' : 'Embed Document'}
          </button>
          
          {message && (
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: message.includes('Success') ? 'var(--success-color)' : 'var(--error-color)' }}>
              {message}
            </div>
          )}
        </motion.div>
      )}
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
