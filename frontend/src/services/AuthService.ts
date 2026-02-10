import { httpClient } from './api/HttpClient';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
} from '@/types';

export class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        { email, password } as LoginRequest
      );

      if (response.success && response.data) {
        // Store both access and refresh tokens
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return response.data;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        { username, email, password } as RegisterRequest
      );

      if (response.success && response.data) {
        // Store both tokens
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return response.data;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await httpClient.post<ApiResponse<{ token: string; refreshToken: string }>>(
        '/auth/refresh',
        { refreshToken }
      );

      if (response.success && response.data) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Auto refresh token before expiry
  startTokenRefreshTimer(): void {
    const { GAME_CONFIG } = require('@/utils/Constants');
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken();
      }
    }, GAME_CONFIG.TOKEN_REFRESH_INTERVAL);
  }
}
