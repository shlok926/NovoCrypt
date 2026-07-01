import { api as axiosInstance } from '../lib/api';
import { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth.types';

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/register', payload);
    return data.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/login', payload);
    return data.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  getCurrentUser: async () => {
    const { data } = await axiosInstance.get('/auth/me');
    return data.data;
  },
};
