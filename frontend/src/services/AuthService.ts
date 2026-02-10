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
        // Access Token\uc740 \uba54\ubaa8\ub9ac\uc5d0\ub9cc \uc800\uc7a5, Refresh Token\uc740 HttpOnly Cookie\ub85c \uc11c\ubc84\uac00 \uad00\ub9ac
        httpClient.setAccessToken(response.data.authToken);
        
        // \uc790\ub3d9 \ud1a0\ud070 \uac31\uc2e0 \ud0c0\uc774\uba38 \uc2dc\uc791
        this.startTokenRefreshTimer();
        
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
        // Access Token \uba54\ubaa8\ub9ac \uc800\uc7a5
        httpClient.setAccessToken(response.data.authToken);
        this.startTokenRefreshTimer();
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
      // \uc11c\ubc84\uc5d0 \ub85c\uadf8\uc544\uc6c3 \uc694\uccad (\uc11c\ubc84\uac00 Refresh Token \uc0ad\uc81c & Blacklist \ucd94\uac00)
      await httpClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // \ud074\ub77c\uc774\uc5b8\ud2b8 Access Token \uc0ad\uc81c
      httpClient.clearAccessToken();
      this.stopTokenRefreshTimer();
    }
  }

  async refreshToken(): Promise<void> {
    try {
      // Refresh Token\uc740 HttpOnly Cookie\ub85c \uc790\ub3d9 \uc804\uc1a1\ub428
      const response = await httpClient.post<ApiResponse<{ authToken: string }>>('/auth/refresh', {});

      if (response.success && response.data) {
        httpClient.setAccessToken(response.data.authToken);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
    }
  }

  isAuthenticated(): boolean {
    return httpClient.hasAccessToken();
  }

  getToken(): string | null {
    return httpClient.getAccessToken();
  }

  // Auto refresh token before expiry
  private refreshTimerId?: number;

  startTokenRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }

    const { GAME_CONFIG } = require('@/utils/Constants');
    this.refreshTimerId = window.setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken();
      }
    }, GAME_CONFIG.TOKEN_REFRESH_INTERVAL);
  }

  stopTokenRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = undefined;
    }
  }
}
