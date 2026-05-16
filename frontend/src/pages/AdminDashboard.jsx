import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import { Users, Activity, CheckCircle, ArrowLeft, Loader2, Terminal, Database, UploadCloud, FileText, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

/* ── Severity badge ── */
const SeverityBadge = ({ severity }) => {
  const cls = (() => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': case 'ERROR': return 'badge-error';
      case 'WARNING': return 'badge-accent';
      default: return 'badge-success';
    }
  })();
  return <span className={`badge ${cls}`} style={{ fontSize: '0.7rem' }}>{severity || '—'}</span>;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // KB upload
  const [kbFile, setKbFile] = useState(null);
  const [kbUploading, setKbUploading] = useState(false);
  const [kbMessage, setKbMessage] = useState('');
  const kbInputRef = React.useRef(null);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, activityRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/admin/stats`),
        axios.get(`${API_BASE}/api/v1/admin/users/pending`),
        axios.get(`${API_BASE}/api/v1/admin/activity?limit=15`),
      ]);
      setStats(statsRes.data);
      setPendingUsers(usersRes.data);
      setActivity(activityRes.data);
    } catch (err) {
      console.error("Admin data fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (userId) => {
    await axios.post(`${API_BASE}/api/v1/admin/users/${userId}/approve`);
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    fetchAll();
  };

  const handleKbUpload = async () => {
    if (!kbFile) return;
    setKbUploading(true); setKbMessage('');
    try {
      const formData = new FormData();
      formData.append('file', kbFile);
      const res = await axios.post(`${API_BASE}/api/v1/documents/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setKbMessage(`✓ Created ${res.data.chunks_created} chunks from ${res.data.filename}`);
      setKbFile(null);
    } catch {
      setKbMessage('Error uploading document');
    } finally {
      setKbUploading(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={28} color="var(--accent)" /></div>;

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ─── Nav ─── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-icon"><ArrowLeft size={18} /></button>
          <Terminal size={22} color="var(--accent)" strokeWidth={2.5} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Admin Console</span>
        </div>
        <ThemeToggle />
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* ─── Stats ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Users', value: stats?.total_users, color: 'var(--accent)' },
            { label: 'Pending', value: stats?.pending_approvals, color: stats?.pending_approvals > 0 ? 'var(--warning)' : 'var(--text-tertiary)' },
            { label: 'Logs Processed', value: stats?.total_logs_processed, color: 'var(--success)' },
            { label: 'API', value: stats?.status, color: 'var(--success)' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
            </motion.div>
          ))}
        </div>

        {/* ─── Two-column: Access Requests + Knowledge Base ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>

          {/* Access Requests */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={18} color="var(--accent)" /> Access Requests</h3>
              {pendingUsers.length > 0 && <span className="badge badge-accent">{pendingUsers.length}</span>}
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {pendingUsers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No pending requests</div>
              ) : pendingUsers.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: i < pendingUsers.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => handleApprove(u.id)} className="btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Base */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}><Database size={18} color="var(--accent)" /> Knowledge Base</h3>
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Upload runbooks for RAG retrieval.</p>
              <div onClick={() => kbInputRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', marginBottom: '0.75rem', background: 'var(--bg-primary)' }}>
                <input type="file" ref={kbInputRef} onChange={(e) => { if (e.target.files?.length) setKbFile(e.target.files[0]); }} style={{ display: 'none' }} accept=".txt,.md,.log" />
                {kbFile ? <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>{kbFile.name}</span> : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}><UploadCloud size={20} /> Select runbook</span>}
              </div>
              <button onClick={handleKbUpload} className="btn-primary" disabled={!kbFile || kbUploading} style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', opacity: (!kbFile || kbUploading) ? 0.5 : 1 }}>
                {kbUploading ? <><Loader2 size={14} className="animate-spin" /> Vectorizing...</> : <><Database size={14} /> Embed document</>}
              </button>
              {kbMessage && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: kbMessage.includes('Error') ? 'var(--error)' : 'var(--success)', textAlign: 'center' }}>{kbMessage}</div>}
            </div>
          </div>
        </div>

        {/* ─── Activity Feed: What's being analyzed ─── */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}><Activity size={18} color="var(--accent)" /> Platform Activity</h3>
          <div className="card" style={{ overflow: 'hidden' }}>
            {activity.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No activity yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>File</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>User</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Severity</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Summary</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', textAlign: 'right' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: i < activity.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '0.7rem 1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={14} color="var(--text-tertiary)" /> {a.filename}</td>
                      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-secondary)' }}>{a.user_email}</td>
                      <td style={{ padding: '0.7rem 0.5rem' }}><SeverityBadge severity={a.severity} /></td>
                      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.issue_summary || '—'}</td>
                      <td style={{ padding: '0.7rem 1.25rem', color: 'var(--text-tertiary)', textAlign: 'right', whiteSpace: 'nowrap' }}>{a.created_at ? new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
