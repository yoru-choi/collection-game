import { httpClient } from './api/HttpClient';
import {
  UserCharacter,
  Character,
  ApiResponse,
  SummonRequest,
  SummonResult,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import { PAGINATION } from '@/utils/Constants';

export class CharacterService {
  async getCharacterList(): Promise<UserCharacter[]> {
    try {
      const response = await httpClient.get<ApiResponse<UserCharacter[]>>('/characters');
      const items = response.data || [];
      return items.map((item: any) =>
        item?.character && item?.characterId ? item : this.mapCharacterDetail(item)
      );
    } catch (error) {
      console.error('Get character list error:', error);
      throw error;
    }
  }

  async getCharacters(params?: PaginationParams): Promise<PaginatedResponse<UserCharacter>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page || PAGINATION.DEFAULT_PAGE));
      queryParams.append('limit', String(params?.limit || PAGINATION.DEFAULT_LIMIT));
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await httpClient.get<ApiResponse<PaginatedResponse<any>>>(
        `/characters?${queryParams.toString()}`
      );
      const data = response.data || { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      const items = (data.items || []).map((item: any) =>
        item?.character && item?.characterId ? item : this.mapCharacterDetail(item)
      );
      return { ...data, items };
    } catch (error) {
      console.error('Get characters error:', error);
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  async getCharacter(id: string): Promise<UserCharacter | null> {
    try {
      const response = await httpClient.get<ApiResponse<any>>(`/characters/${id}`);
      return response.data ? this.mapCharacterDetail(response.data) : null;
    } catch (error) {
      console.error('Get character error:', error);
      return null;
    }
  }

  async levelUpCharacter(id: string, expCrystals: number): Promise<UserCharacter | null> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(
        `/characters/${id}/level-up`,
        { exp_crystals: expCrystals }
      );
      return response.data ? this.mapCharacterDetail(response.data) : null;
    } catch (error) {
      console.error('Level up character error:', error);
      throw error;
    }
  }

  async evolveCharacter(id: string): Promise<UserCharacter | null> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(
        `/characters/${id}/awaken`
      );
      return response.data ? this.mapCharacterDetail(response.data) : null;
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

  async summon(type: 'normal' | 'premium', count: number): Promise<SummonResult[]> {
    try {
      const endpoint = type === 'premium' ? '/summon/premium' : '/summon/normal';
      const response = await httpClient.post<ApiResponse<{ results: SummonResult[] }>>(
        endpoint,
        { type, count } as SummonRequest
      );
      
      if (response.success && response.data?.results) {
        return response.data.results;
      }
      throw new Error(response.error || 'Summon failed');
    } catch (error) {
      console.error('Summon error:', error);
      throw error;
    }
  }

  private mapCharacterDetail(detail: any): UserCharacter {
    const character: Character = {
      id: String(detail.character_id || detail.characterId),
      name: detail.character_name || detail.name,
      grade: detail.grade,
      element: detail.element,
      class: detail.class,
      baseHp: detail.base_hp ?? detail.baseHp,
      baseAtk: detail.base_atk ?? detail.baseAtk,
      baseDef: detail.base_def ?? detail.baseDef,
      baseSpd: detail.base_spd ?? detail.baseSpd,
      skill1Id: String(detail.skill_1_id || detail.skill1Id || ''),
      skill2Id: String(detail.skill_2_id || detail.skill2Id || ''),
      skill3Id: String(detail.skill_3_id || detail.skill3Id || ''),
      skill4Id: String(detail.skill_4_id || detail.skill4Id || ''),
      imageUrl: detail.image_url || detail.imageUrl || '',
    };

    return {
      id: String(detail.id),
      userId: String(detail.user_id || detail.userId),
      characterId: String(detail.character_id || detail.characterId),
      character,
      level: detail.level,
      exp: detail.exp,
      currentHp: detail.current_hp ?? detail.currentHp,
      currentAtk: detail.current_atk ?? detail.currentAtk,
      currentDef: detail.current_def ?? detail.currentDef,
      currentSpd: detail.current_spd ?? detail.currentSpd,
      currentCrt: detail.crit_rate ?? detail.currentCrt ?? 0,
      currentCrtDmg: detail.crit_damage ?? detail.currentCrtDmg ?? 0,
      currentAcc: detail.accuracy ?? detail.currentAcc ?? 0,
      currentRes: detail.resistance ?? detail.currentRes ?? 0,
      skill1Level: detail.skill_1_level ?? detail.skill1Level ?? 1,
      skill2Level: detail.skill_2_level ?? detail.skill2Level ?? 1,
      skill3Level: detail.skill_3_level ?? detail.skill3Level ?? 1,
      skill4Level: detail.skill_4_level ?? detail.skill4Level ?? 1,
      awakened: detail.awakened ? 1 : 0,
      obtainedAt: detail.obtained_at || detail.obtainedAt || '',
    };
  }
}

export const characterService = new CharacterService();
