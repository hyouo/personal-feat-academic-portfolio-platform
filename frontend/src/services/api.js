import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
// Public asset URLs share the configured API origin; default deployment is same-origin.
export function assetUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/uploads/') || value.includes('\\')) {
    throw new Error('Invalid upload URL');
  }
  const backend = new URL(api.defaults.baseURL, window.location.origin);
  return new URL(value, backend.origin).href;
}

// Private files require an Authorization header. Plain <a> navigation cannot send it.
export async function downloadAttachment(attachment) {
  const response = await api.get(assetUrl(attachment.file_url), { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = attachment.original_name || 'attachment';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
