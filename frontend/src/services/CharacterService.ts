import { httpClient } from './api/HttpClient';
import {
  UserCharacter,
  ApiResponse,
  SummonRequest,
  SummonResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import { PAGINATION } from '@/utils/Constants';

export class CharacterService {
  async getCharacters(params?: PaginationParams): Promise<PaginatedResponse<UserCharacter>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page || PAGINATION.DEFAULT_PAGE));
      queryParams.append('limit', String(params?.limit || PAGINATION.DEFAULT_LIMIT));
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await httpClient.get<ApiResponse<PaginatedResponse<UserCharacter>>>(
        `/characters?${queryParams.toString()}`
      );
      return response.data || { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    } catch (error) {
      console.error('Get characters error:', error);
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  async getCharacter(id: string): Promise<UserCharacter | null> {
    try {
      const response = await httpClient.get<ApiResponse<UserCharacter>>(`/characters/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Get character error:', error);
      return null;
    }
  }

  async levelUpCharacter(id: string): Promise<UserCharacter | null> {
    try {
      const response = await httpClient.post<ApiResponse<UserCharacter>>(
        `/characters/${id}/level-up`
      );
      return response.data || null;
    } catch (error) {
      console.error('Level up character error:', error);
      throw error;
    }
  }

  async evolveCharacter(id: string): Promise<UserCharacter | null> {
    try {
      const response = await httpClient.post<ApiResponse<UserCharacter>>(
        `/characters/${id}/evolve`
      );
      return response.data || null;
    } catch (error) {
      console.error('Evolve character error:', error);
      throw error;
    }
  }

  async skillUpCharacter(id: string, skillSlot: number): Promise<UserCharacter | null> {
    try {
      const response = await httpClient.post<ApiResponse<UserCharacter>>(
        `/characters/${id}/skill-up`,
        { skillSlot }
      );
      return response.data || null;
    } catch (error) {
      console.error('Skill up character error:', error);
      throw error;
    }
  }

  async summon(type: 'normal' | 'premium', count: number): Promise<SummonResponse> {
    try {
      const endpoint = type === 'premium' ? '/summon/premium' : '/summon/normal';
      const response = await httpClient.post<ApiResponse<SummonResponse>>(
        endpoint,
        { type, count } as SummonRequest
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Summon failed');
    } catch (error) {
      console.error('Summon error:', error);
      throw error;
    }
  }
}

export const characterService = new CharacterService();
