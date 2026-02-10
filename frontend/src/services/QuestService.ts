import { httpClient } from './api/HttpClient';
import { ApiResponse, Quest } from '@/types';

export class QuestService {
  async getDailyQuests(): Promise<Quest[]> {
    try {
      const response = await httpClient.get<ApiResponse<Quest[]>>('/quests/daily');
      return response.data || [];
    } catch (error) {
      console.error('Get daily quests error:', error);
      return [];
    }
  }

  async completeQuest(questId: string): Promise<boolean> {
    try {
      const response = await httpClient.post<ApiResponse<void>>(`/quests/${questId}/complete`);
      return response.success;
    } catch (error) {
      console.error('Complete quest error:', error);
      throw error;
    }
  }

  async claimReward(questId: string): Promise<any> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(`/quests/${questId}/claim`);
      return response.data;
    } catch (error) {
      console.error('Claim quest reward error:', error);
      throw error;
    }
  }
}

export const questService = new QuestService();
