import { httpClient } from './api/HttpClient';
import { ApiResponse, Guild, GuildMember, PaginatedResponse, PaginationParams } from '@/types';

export class GuildService {
  async getGuilds(params?: PaginationParams): Promise<PaginatedResponse<Guild>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page || 1));
      queryParams.append('limit', String(params?.limit || 20));

      const response = await httpClient.get<ApiResponse<PaginatedResponse<Guild>>>(
        `/guilds?${queryParams.toString()}`
      );
      return response.data || { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    } catch (error) {
      console.error('Get guilds error:', error);
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  async createGuild(name: string, description?: string): Promise<Guild | null> {
    try {
      const response = await httpClient.post<ApiResponse<Guild>>('/guilds', {
        name,
        description,
      });
      return response.data || null;
    } catch (error) {
      console.error('Create guild error:', error);
      throw error;
    }
  }

  async joinGuild(guildId: string): Promise<boolean> {
    try {
      const response = await httpClient.post<ApiResponse<void>>(`/guilds/${guildId}/join`);
      return response.success;
    } catch (error) {
      console.error('Join guild error:', error);
      throw error;
    }
  }

  async getGuild(guildId: string): Promise<Guild | null> {
    try {
      const response = await httpClient.get<ApiResponse<Guild>>(`/guilds/${guildId}`);
      return response.data || null;
    } catch (error) {
      console.error('Get guild error:', error);
      return null;
    }
  }

  async getMembers(guildId: string): Promise<GuildMember[]> {
    try {
      const response = await httpClient.get<ApiResponse<GuildMember[]>>(
        `/guilds/${guildId}/members`
      );
      return response.data || [];
    } catch (error) {
      console.error('Get guild members error:', error);
      return [];
    }
  }

  async leaveGuild(guildId: string): Promise<boolean> {
    try {
      const response = await httpClient.post<ApiResponse<void>>(`/guilds/${guildId}/leave`);
      return response.success;
    } catch (error) {
      console.error('Leave guild error:', error);
      throw error;
    }
  }
}

export const guildService = new GuildService();
