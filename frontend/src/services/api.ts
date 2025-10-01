import axios from 'axios';
import type { AuthResponse, Message, BlockchainInfo } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor để thêm token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }),
  
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
};

export const messageAPI = {
  getMessages: () => api.get<Message[]>('/messages'),
};

export const blockchainAPI = {
  getInfo: () => api.get<BlockchainInfo>('/blockchain/info'),
  getChain: () => api.get('/blockchain/chain'),
};

export default api;