// Central API configuration — dynamically detects development/cloud environments
const getApiBase = () => {
  // If explicitly configured via Vite env, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // If running in a browser environment
  if (typeof window !== 'undefined' && window.location) {
    const { origin, hostname, port } = window.location;

    // Vite dev server convention: frontend on 5173, API on 8000 on the same host.
    if (port === '5173') {
      return `${window.location.protocol}//${hostname}:8000`;
    }

    // Production containers and reverse proxies serve /api from the same origin by default.
    if (hostname) {
      return origin;
    }
  }

  return 'http://localhost:8000';
};

const API_BASE = getApiBase();

export default API_BASE;
