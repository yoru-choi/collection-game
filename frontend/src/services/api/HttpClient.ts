import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { GAME_CONFIG } from '@/utils/Constants';

export class HttpClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private accessToken: string | null = null; // 메모리에만 저장 (PRD 4.4.1)

  constructor() {
    this.client = axios.create({
      baseURL: GAME_CONFIG.API_BASE_URL + '/api/v1',
      timeout: 10000,
      withCredentials: true, // HttpOnly Cookie 지원 (Refresh Token)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token (메모리에서 가져옴)
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Refresh Token은 HttpOnly Cookie로 자동 전송됨 (withCredentials: true)
            const response = await this.client.post('/auth/refresh', {});
            const { authToken } = response.data.data;

            // Access Token은 메모리에만 저장
            this.setAccessToken(authToken);

            this.onRefreshed(authToken);
            this.refreshSubscribers = [];
            this.isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${authToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            this.clearAccessToken();
            // 로그인 페이지로 리다이렉트 (Phaser Scene 전환)
            window.dispatchEvent(new CustomEvent('auth:logout'));
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  // Access Token 관리 메서드 (메모리 기반)
  public setAccessToken(token: string): void {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public clearAccessToken(): void {
    this.accessToken = null;
  }

  public hasAccessToken(): boolean {
    return this.accessToken !== null;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const httpClient = new HttpClient();
