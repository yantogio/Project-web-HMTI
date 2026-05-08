import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// INTERCEPTOR: Ini buat nempelin "KTP" otomatis tiap kali upload
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); // Pastikan key-nya sama dengan pas login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadDocument = (formData) => {
  return api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Tambahkan export baru untuk hapus
export const deleteDocument = (id) => {
  return api.delete(`/documents/${id}`);
};

export const getDocuments = () => {
  return api.get('/documents');
};