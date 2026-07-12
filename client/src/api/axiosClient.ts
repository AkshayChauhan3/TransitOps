import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from localStorage on every request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, attempt token refresh then retry the original request
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('transitops_refresh_token');
        const { data } = await axios.post(
          `${axiosClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem('transitops_token', data.accessToken);
        localStorage.setItem('transitops_refresh_token', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosClient(original);
      } catch {
        // Refresh failed — clear session and redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
