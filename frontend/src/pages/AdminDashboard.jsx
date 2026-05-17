import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import { Users, Activity, CheckCircle, ArrowLeft, Loader2, Terminal, Database, UploadCloud, FileText, AlertCircle, Trash2, File } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

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

/* ── File type icon helper ── */
const FileTypeIcon = ({ type }) => {
  const colors = { pdf: '#e74c3c', docx: '#2980b9', txt: '#27ae60', md: '#8e44ad', log: '#e67e22' };
  return (
    <div style={{ width: 28, height: 28, borderRadius: '6px', background: `${colors[type] || '#666'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: colors[type] || '#666', textTransform: 'uppercase', border: `1px solid ${colors[type] || '#666'}25` }}>
      {type}
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // KB upload
  const [kbFile, setKbFile] = useState(null);
  const [kbUploading, setKbUploading] = useState(false);
  const kbInputRef = React.useRef(null);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, activityRes, docsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/admin/stats`),
        axios.get(`${API_BASE}/api/v1/admin/users/pending`),
        axios.get(`${API_BASE}/api/v1/admin/activity?limit=15`),
        axios.get(`${API_BASE}/api/v1/documents/`).catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setPendingUsers(usersRes.data);
      setActivity(activityRes.data);
      setDocuments(docsRes.data);
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
    toast.success('User approved');
    fetchAll();
  };

  const handleKbUpload = async () => {
    if (!kbFile) return;
    setKbUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', kbFile);
      const res = await axios.post(`${API_BASE}/api/v1/documents/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Created ${res.data.chunks_created} chunks from ${res.data.filename}`);
      setKbFile(null);
      if (kbInputRef.current) kbInputRef.current.value = '';
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setKbUploading(false);
    }
  };

  const handleDeleteDoc = async (docId, filename) => {
    try {
      await axios.delete(`${API_BASE}/api/v1/documents/${docId}`);
      toast.success(`Deleted ${filename}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={28} color="var(--accent)" /></div>;

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ─── Nav ─── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 2rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-icon" style={{ width: 32, height: 32 }}><ArrowLeft size={14} /></button>
          <div style={{ width: 26, height: 26, borderRadius: '8px', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Admin Console</span>
        </div>
        <ThemeToggle />
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

        {/* ─── Stats ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { label: 'Users', value: stats?.total_users, color: 'var(--accent)' },
            { label: 'Pending', value: stats?.pending_approvals, color: stats?.pending_approvals > 0 ? 'var(--warning)' : 'var(--text-tertiary)' },
            { label: 'Logs Processed', value: stats?.total_logs_processed, color: 'var(--success)' },
            { label: 'Documents', value: documents.length, color: 'var(--accent)' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: '0.3rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
            </motion.div>
          ))}
        </div>

        {/* ─── Two-column: Access Requests + KB Upload ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>

          {/* Access Requests */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={16} color="var(--accent)" /> Access Requests</h3>
              {pendingUsers.length > 0 && <span className="badge badge-accent">{pendingUsers.length}</span>}
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {pendingUsers.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No pending requests</div>
              ) : pendingUsers.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: i < pendingUsers.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.email}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => handleApprove(u.id)} className="btn-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}>
                    <CheckCircle size={13} /> Approve
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Base Upload */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}><Database size={16} color="var(--accent)" /> Upload Document</h3>
            <div className="card" style={{ padding: '1rem' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '0.6rem' }}>Upload runbooks, SOPs, and docs (PDF, DOCX, TXT, MD).</p>
              <div onClick={() => kbInputRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '1rem', textAlign: 'center', cursor: 'pointer', marginBottom: '0.6rem', background: 'var(--bg-primary)' }}>
                <input type="file" ref={kbInputRef} onChange={(e) => { if (e.target.files?.length) setKbFile(e.target.files[0]); }} style={{ display: 'none' }} accept=".txt,.md,.log,.pdf,.docx" />
                {kbFile
                  ? <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>{kbFile.name}</span>
                  : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}><UploadCloud size={18} /> Select file</span>
                }
              </div>
              <button onClick={handleKbUpload} className="btn-primary" disabled={!kbFile || kbUploading} style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem', opacity: (!kbFile || kbUploading) ? 0.5 : 1 }}>
                {kbUploading ? <><Loader2 size={13} className="animate-spin" /> Vectorizing...</> : <><Database size={13} /> Embed Document</>}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Document Management ─── */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}><File size={16} color="var(--accent)" /> Knowledge Base Documents</h3>
          <div className="card" style={{ overflow: 'hidden' }}>
            {documents.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No documents uploaded yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Document</th>
                    <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Type</th>
                    <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Chunks</th>
                    <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Uploaded By</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => (
                    <tr key={doc.id} style={{ borderBottom: i < documents.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <FileTypeIcon type={doc.file_type} />
                        {doc.filename}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>{doc.file_type}</td>
                      <td style={{ padding: '0.6rem 0.5rem' }}><span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{doc.chunk_count}</span></td>
                      <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-tertiary)' }}>{doc.uploaded_by}</td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                          className="btn-ghost"
                          style={{ padding: '0.25rem 0.5rem', color: 'var(--error)', fontSize: '0.75rem' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ─── Activity Feed ─── */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}><Activity size={16} color="var(--accent)" /> Platform Activity</h3>
          <div className="card" style={{ overflow: 'hidden' }}>
            {activity.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No activity yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>File</th>
                    <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>User</th>
                    <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Severity</th>
                    <th style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Summary</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', textAlign: 'right' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: i < activity.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={13} color="var(--text-tertiary)" /> {a.filename}</td>
                      <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>{a.user_email}</td>
                      <td style={{ padding: '0.6rem 0.5rem' }}><SeverityBadge severity={a.severity} /></td>
                      <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.issue_summary || '—'}</td>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-tertiary)', textAlign: 'right', whiteSpace: 'nowrap' }}>{a.created_at ? new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</td>
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
