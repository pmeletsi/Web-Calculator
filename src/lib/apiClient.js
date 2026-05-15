import axios from 'axios';

// Single configured Axios instance for all backend calls.
// Story 6.1 attaches request/response interceptors (JWT bearer, 401 → logout).
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
