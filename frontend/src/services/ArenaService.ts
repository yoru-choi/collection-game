import { httpClient } from './api/HttpClient';
import { ApiResponse, ArenaPlayer, ArenaMatch, PaginatedResponse, PaginationParams } from '@/types';

export class ArenaService {
  async getRanking(params?: PaginationParams): Promise<PaginatedResponse<ArenaPlayer>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page || 1));
      queryParams.append('limit', String(params?.limit || 50));

      const response = await httpClient.get<ApiResponse<PaginatedResponse<ArenaPlayer>>>(
        `/arena/ranking?${queryParams.toString()}`
      );
      return response.data || { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    } catch (error) {
      console.error('Get arena ranking error:', error);
      return { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }
  }

  async attack(targetUserId: string): Promise<ArenaMatch | null> {
    try {
      const response = await httpClient.post<ApiResponse<ArenaMatch>>('/arena/attack', {
        targetUserId,
      });
      return response.data || null;
    } catch (error) {
      console.error('Arena attack error:', error);
      throw error;
    }
  }

  async setDefenseTeam(teamIds: string[]): Promise<boolean> {
    try {
      const response = await httpClient.post<ApiResponse<void>>('/arena/defense', {
        teamIds,
      });
      return response.success;
    } catch (error) {
      console.error('Set defense team error:', error);
      throw error;
    }
  }

  async getHistory(params?: PaginationParams): Promise<PaginatedResponse<ArenaMatch>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page || 1));
      queryParams.append('limit', String(params?.limit || 20));

      const response = await httpClient.get<ApiResponse<PaginatedResponse<ArenaMatch>>>(
        `/arena/history?${queryParams.toString()}`
      );
      return response.data || { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    } catch (error) {
      console.error('Get arena history error:', error);
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }
}

export const arenaService = new ArenaService();
