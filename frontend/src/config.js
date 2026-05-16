// Central API configuration — change this ONE place for all environments.
// In production, set VITE_API_URL in your .env or deployment config.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default API_BASE;
