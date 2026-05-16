import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useAuth();
  return (
    <button onClick={toggleTheme} className="btn-icon" aria-label="Toggle theme">
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
