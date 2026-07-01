import axios from 'axios';
import type {
  ApiError,
  ApiResponse,
  AuthResponse,
  LabCreateInput,
  LabSession,
  RiskAssessment,
  RiskInput,
  RiskResult,
  User,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage') 
    ? JSON.parse(localStorage.getItem('auth-storage') as string).state?.token 
    : null;
    
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete api.defaults.headers.common.Authorization;
};

const unwrap = <T>(payload: ApiResponse<T>): T => {
  if (payload.success) {
    return payload.data;
  }
  throw new Error(payload.error.message || 'Request failed');
};

const unwrapAxiosPayload = <T>(body: unknown): T => {
  if (body && typeof body === 'object' && 'success' in body) {
    const payload = body as ApiResponse<T>;
    return unwrap(payload);
  }
  throw new Error('Unexpected response');
};

const exec = async <T>(call: Promise<{ data: unknown }>): Promise<T> => {
  try {
    const { data } = await call;
    return unwrapAxiosPayload<T>(data);
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error;
    }
    if (axios.isAxiosError(error) && error.response?.data !== undefined) {
      const body = error.response.data;
      try {
        if (body && typeof body === 'object' && 'success' in body) {
          const apiErr = body as ApiError;
          if (!apiErr.success && apiErr.error?.message) {
            throw new Error(apiErr.error.message);
          }
        }
      } catch (inner) {
        if (inner instanceof Error && inner.message) {
          throw inner;
        }
      }
      if (typeof body === 'string' && body.length > 0) {
        throw new Error(body);
      }
    }
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        throw new Error('Authentication required');
      }
      if (status === 404) {
        throw new Error('Resource not found');
      }
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error — is the backend running?');
      }
      throw new Error(error.message || 'Request failed');
    }
    throw error instanceof Error ? error : new Error('Request failed');
  }
};

export const authApi = {
  register(input: { email: string; password: string; name?: string }) {
    return exec<AuthResponse>(api.post('/auth/register', input));
  },
  login(input: { email: string; password: string }) {
    return exec<AuthResponse>(api.post('/auth/login', input));
  },
  me() {
    return exec<{ user: User }>(api.get('/auth/me')).then((payload) => payload.user);
  },
};

export const riskApi = {
  calculate(input: RiskInput) {
    return exec<RiskResult>(api.post('/risk/calculate', input));
  },
  history() {
    return exec<RiskAssessment[]>(api.get('/risk/history'));
  },
  byId(id: string) {
    return exec<RiskAssessment>(api.get(`/risk/${id}`));
  },
};

export const labApi = {
  create(input: LabCreateInput) {
    return exec<LabSession>(api.post('/lab/sessions', input));
  },
  history() {
    return exec<LabSession[]>(api.get('/lab/sessions'));
  },
  byId(id: string) {
    return exec<LabSession>(api.get(`/lab/sessions/${id}`));
  },
};
