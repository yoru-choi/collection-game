import { httpClient } from './api/HttpClient';
import { ApiResponse, Dungeon, BattleState, BattleResult } from '@/types';

export class DungeonService {
  async getDungeons(type?: string): Promise<Dungeon[]> {
    try {
      const url = type ? `/dungeons?type=${type}` : '/dungeons';
      const response = await httpClient.get<ApiResponse<Dungeon[]>>(url);
      return response.data || [];
    } catch (error) {
      console.error('Get dungeons error:', error);
      return [];
    }
  }

  async enterDungeon(dungeonId: string): Promise<BattleState | null> {
    try {
      const response = await httpClient.post<ApiResponse<BattleState>>(
        `/dungeons/${dungeonId}/enter`
      );
      return response.data || null;
    } catch (error) {
      console.error('Enter dungeon error:', error);
      throw error;
    }
  }

  async startBattle(dungeonId: string, teamIds: string[]): Promise<BattleState | null> {
    try {
      const response = await httpClient.post<ApiResponse<BattleState>>(
        `/dungeons/${dungeonId}/battle`,
        { teamIds }
      );
      return response.data || null;
    } catch (error) {
      console.error('Start battle error:', error);
      throw error;
    }
  }

  async performBattleAction(battleId: string, action: any): Promise<any> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(
        `/battle/${battleId}/action`,
        action
      );
      return response.data;
    } catch (error) {
      console.error('Battle action error:', error);
      throw error;
    }
  }

  async getBattleResult(battleId: string): Promise<BattleResult | null> {
    try {
      const response = await httpClient.post<ApiResponse<BattleResult>>(
        `/battle/${battleId}/result`
      );
      return response.data || null;
    } catch (error) {
      console.error('Get battle result error:', error);
      throw error;
    }
  }
}

export const dungeonService = new DungeonService();
