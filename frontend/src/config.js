// Central API configuration — highly robust for any environment.
const getApiBase = () => {
  // If explicitly configured via Vite env, use it (e.g., for detached frontend/backend)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // By default, return an empty string. 
  // This forces Axios to make relative requests (e.g. '/api/v1/...')
  // which perfectly inherits the current browser origin.
  // This automatically routes through Nginx in production/Docker, 
  // or through Vite's dev proxy in local development, avoiding ALL CORS and Cloud Shell auth issues!
  return '';
};

const API_BASE = getApiBase();

export default API_BASE;
