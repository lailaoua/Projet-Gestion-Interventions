import axios from 'axios';

export const getDefaultBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:5000/api';
  }

  return '/api';
};

const api = axios.create({
  baseURL: getDefaultBaseUrl(),
  timeout: 15000,
});

// Request logging for debug
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('pfaToken');
    if (token && !config.headers?.Authorization) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`
      };
    }

    console.debug('[API] Request', config.method, config.url, config);
  } catch {}
  return config;
}, (err) => {
  console.error('[API] Request error', err);
  return Promise.reject(err);
});

// Response logging for debug
api.interceptors.response.use((res) => {
  try { console.debug('[API] Response', res.status, res.config.url, res.data); } catch {}
  return res;
}, (err) => {
  try {
    console.error('[API] Response error', err?.message, err?.config?.url, err?.response?.status, err?.response?.data);
  } catch {}
  return Promise.reject(err);
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getFullImageUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  // Utiliser l'endpoint API pour les images au lieu des fichiers statiques
  const fileName = photoUrl.replace('/uploads/', '');
  const baseUrl = getDefaultBaseUrl();
  return `${baseUrl}/equipments/photos/${fileName}`;
}

export default api;
