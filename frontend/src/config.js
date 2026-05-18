// Central API configuration — dynamically detects development/cloud environments
const getApiBase = () => {
  // If explicitly configured via Vite env, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // If running in a browser environment
  if (typeof window !== 'undefined' && window.location) {
    const { origin, hostname } = window.location;

    // Detect if we are running under a port-swapping dev environment (e.g. localhost, Cloud Shell, Gitpod, Codespaces)
    // Most dev platforms expose the dev server on port 5173 (Vite default) and API on 8000.
    if (origin.includes('5173')) {
      return origin.replace('5173', '8000');
    }

    // Fallback: if we are not running on standard Vite port, but we are on some hostname,
    // let's assume we can try port 8000 on the same host/scheme.
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If same domain serves API (e.g. under a reverse proxy or deployed single-domain), return origin
      return origin;
    }
  }

  return 'http://localhost:8000';
};

const API_BASE = getApiBase();

export default API_BASE;
