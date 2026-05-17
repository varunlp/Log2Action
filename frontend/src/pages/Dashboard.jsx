import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Settings, LogOut, Plus, Trash2, BookOpen, ChevronLeft, ChevronRight, Waves } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';
import toast from 'react-hot-toast';
import UploadZone from '../components/UploadZone';
import ModeToggle from '../components/ModeToggle';
import ChatMessage from '../components/ChatMessage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';


function groupByDate(items) {
  const groups = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now - 86400000).toDateString();
  for (const item of items) {
    const d = item.created_at ? new Date(item.created_at) : new Date();
    const ds = d.toDateString();
    let label;
    if (ds === today) label = 'Today';
    else if (ds === yesterday) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return groups;
}


export default function Dashboard() {
  const [mode, setMode] = useState('log_analysis');
  const [messages, setMessages] = useState([]);
  const [sidebarHistory, setSidebarHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { loadSidebarHistory(); }, []);

  const loadSidebarHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/chat/history?limit=50`);
      setSidebarHistory(res.data);
    } catch (err) { console.error("Failed to load history", err); }
  };

  const newConversation = () => { setMessages([]); setActiveHistoryId(null); };

  const loadHistoryItem = (item) => {
    setActiveHistoryId(item.id);
    setMessages([
      { id: `user-${item.id}`, isUser: true, input_text: item.input_text, input_filename: item.input_filename, mode: item.mode },
      { id: `ai-${item.id}`, isUser: false, mode: item.mode, response_data: item.response_data, sources: item.sources }
    ]);
    setMode(item.mode);
  };

  const handleSubmit = async (text) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, isUser: true, input_text: text, mode }]);
    try {
      setIsAnalyzing(true);
      const response = await axios.post(`${API_BASE}/api/v1/chat/`, { text, mode });
      const data = response.data;
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`, isUser: false, mode: data.mode,
        response_data: data.mode === 'log_analysis' ? data.analysis : { answer: data.answer, confidence: data.confidence },
        sources: data.sources
      }]);
      toast.success(data.mode === 'log_analysis' ? 'Analysis complete' : 'Answer generated');
      loadSidebarHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "An error occurred.");
    } finally { setIsAnalyzing(false); }
  };

  const handleUploadFile = async (file) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, isUser: true, input_text: `Analyzing ${file.name}...`, input_filename: file.name, mode }]);
    try {
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      const response = await axios.post(`${API_BASE}/api/v1/chat/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = response.data;
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`, isUser: false, mode: data.mode,
        response_data: data.analysis || { answer: data.answer, confidence: data.confidence },
        sources: data.sources
      }]);
      toast.success('Analysis complete');
      loadSidebarHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "File upload failed.");
    } finally { setIsAnalyzing(false); }
  };

  const clearAllHistory = async () => {
    try {
      await axios.delete(`${API_BASE}/api/v1/chat/history`);
      setMessages([]); setSidebarHistory([]); setActiveHistoryId(null);
      toast.success('History cleared');
    } catch (err) { toast.error('Failed to clear history'); }
  };

  const grouped = groupByDate(sidebarHistory);

  const modeConfig = {
    log_analysis: {
      icon: <Terminal size={28} color="#0ea5e9" strokeWidth={1.8} />,
      title: 'Log Analysis',
      desc: 'Paste logs or upload files — AI diagnoses using your knowledge base.',
      chips: [
        { label: 'Paste an error stack trace', action: null },
        { label: 'Upload a .log file', action: null },
        { label: 'Analyze OOM crash', action: null },
      ],
      iconBg: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.08))',
      iconBorder: 'rgba(14,165,233,0.2)',
    },
    knowledge: {
      icon: <BookOpen size={28} color="#8b5cf6" strokeWidth={1.8} />,
      title: 'Knowledge Assistant',
      desc: 'Query your uploaded runbooks, SOPs, and operational docs.',
      chips: [
        { label: 'Connection pool troubleshooting', action: () => handleSubmit("How do I troubleshoot connection pool exhaustion?") },
        { label: 'Deployment checklist', action: () => handleSubmit("What is the standard deployment checklist?") },
        { label: 'Incident response steps', action: () => handleSubmit("What are the incident response steps?") },
      ],
      iconBg: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(167,139,250,0.08))',
      iconBorder: 'rgba(139,92,246,0.2)',
    }
  };
  const mc = modeConfig[mode];

  return (
    <div className="chat-layout">
      {/* ═══ SIDEBAR ═══ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar"
          >
            <div style={{ padding: '0.7rem' }}>
              <button onClick={newConversation} className="btn-primary" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', borderRadius: '10px', fontWeight: 600 }}>
                <Plus size={14} /> New Conversation
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.3rem 0' }}>
              {Object.keys(grouped).length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>No conversations yet</div>
              ) : (
                Object.entries(grouped).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <div style={{ padding: '0.55rem 1rem 0.2rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>
                      {dateLabel}
                    </div>
                    {items.map(item => (
                      <button
                        key={item.id}
                        className={`sidebar-item ${activeHistoryId === item.id ? 'active' : ''}`}
                        onClick={() => loadHistoryItem(item)}
                        title={item.input_text}
                      >
                        {item.mode === 'log_analysis'
                          ? <Terminal size={12} style={{ flexShrink: 0, color: '#0ea5e9' }} />
                          : <BookOpen size={12} style={{ flexShrink: 0, color: '#8b5cf6' }} />
                        }
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.input_filename || item.input_text?.slice(0, 40) || 'Untitled'}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '0.5rem 0.7rem', borderTop: '1px solid var(--border-subtle)' }}>
              {sidebarHistory.length > 0 && (
                <button onClick={clearAllHistory} className="btn-ghost" style={{ width: '100%', fontSize: '0.72rem', padding: '0.35rem', color: 'var(--text-tertiary)', justifyContent: 'center' }}>
                  <Trash2 size={11} /> Clear all
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CHAT ═══ */}
      <div className="chat-main">
        {/* Nav */}
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-icon" style={{ width: 32, height: 32 }}>
              {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
            <div style={{ width: 26, height: 26, borderRadius: '8px', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Terminal size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.5px' }}>LOG2ACTION</span>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <ModeToggle mode={mode} onModeChange={setMode} />
            <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 0.35rem' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{user?.email}</span>
            <ThemeToggle />
            {user?.is_admin && <button onClick={() => navigate('/admin')} className="btn-icon" style={{ width: 32, height: 32 }} title="Admin"><Settings size={14} /></button>}
            <button onClick={logout} className="btn-icon" style={{ width: 32, height: 32 }} title="Sign out"><LogOut size={14} /></button>
          </div>
        </nav>

        {/* Messages */}
        <div className="chat-messages">
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '5rem 2rem 2rem' }}>
                <motion.div
                  className="float"
                  style={{
                    width: 60, height: 60, borderRadius: '18px', margin: '0 auto 1.5rem',
                    background: mc.iconBg, border: `1px solid ${mc.iconBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {mc.icon}
                </motion.div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>{mc.title}</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.86rem', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
                  {mc.desc}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
                  {mc.chips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={chip.action || undefined}
                      className="btn-secondary"
                      style={{
                        padding: '0.4rem 0.85rem', fontSize: '0.76rem',
                        borderRadius: '20px', fontWeight: 500
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} isUser={msg.isUser} />)
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="chat-input-bar">
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <UploadZone onSubmit={handleSubmit} onUploadFile={handleUploadFile} isAnalyzing={isAnalyzing} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}
