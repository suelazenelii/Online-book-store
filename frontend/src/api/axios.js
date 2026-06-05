import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL:         `${BASE}/api`,
  withCredentials: true,
});

let _adminToken = null;
export const setAdminToken = (token) => { _adminToken = token; };

api.interceptors.request.use(config => {
  if (_adminToken) config.headers.Authorization = `Bearer ${_adminToken}`;
  return config;
});

let isRefreshing = false;
let queue        = [];

const flush = (err, token) => {
  queue.forEach(({ resolve, reject }) => err ? reject(err) : resolve(token));
  queue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;

    // Auth endpoints nuk kanë nevojë për refresh — kthe error direkt
    const isAuthRoute = orig.url?.includes('/auth/login') ||
                        orig.url?.includes('/auth/register') ||
                        orig.url?.includes('/auth/refresh');

    if (err.response?.status === 401 && !orig._retry && !isAuthRoute) {
      orig._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); })
          .catch(e => Promise.reject(e));
      }

      isRefreshing = true;

      try {
        // cookie admin_rt dërgohet automatikisht nga browser (withCredentials)
        const res = await fetch(`${BASE}/api/admin/auth/refresh`, {
          method:      'POST',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Refresh failed');

        const { token } = await res.json();
        _adminToken = token;
        orig.headers.Authorization = `Bearer ${token}`;
        flush(null, token);
        return api(orig);
      } catch (e) {
        flush(e, null);
        _adminToken = null;
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
