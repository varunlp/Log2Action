import React from 'react';
import { Terminal, BookOpen } from 'lucide-react';

const MODES = [
  { key: 'log_analysis', label: 'Log Analysis', icon: Terminal, color: '#0ea5e9' },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen, color: '#8b5cf6' },
];

export default function ModeToggle({ mode, onModeChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--bg-elevated)',
      borderRadius: '11px',
      padding: '3px',
      border: '1px solid var(--border)',
      position: 'relative'
    }}>
      {MODES.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#fff' : 'var(--text-tertiary)',
              background: isActive ? `linear-gradient(135deg, ${m.color}, ${m.color}cc)` : 'transparent',
              boxShadow: isActive ? `0 2px 8px ${m.color}30` : 'none',
              transition: 'all 0.25s ease',
              zIndex: 1
            }}
          >
            <Icon size={13} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
