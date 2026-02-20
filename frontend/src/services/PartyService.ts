import { httpClient } from './api/HttpClient';
import { UserCharacter, ApiResponse } from '@/types';

export interface PartyMember {
  slotIndex: number;       // 0-based slot index (0~3)
  userCharacterId: number;
  character?: UserCharacter;
}

export interface PartyResponse {
  members: PartyMember[];
}

export class PartyService {
  /** 현재 파티 정보 조회 */
  async getParty(): Promise<PartyMember[]> {
    try {
      const response = await httpClient.get<ApiResponse<PartyResponse>>('/party');
      return response.data?.members || [];
    } catch (error) {
      console.error('Get party error:', error);
      return [];
    }
  }

  /** 파티 구성 저장 (슬롯 순서대로 userCharacterId 배열) */
  async setParty(memberIds: number[]): Promise<PartyMember[]> {
    try {
      const response = await httpClient.put<ApiResponse<PartyResponse>>('/party', {
        members: memberIds,
      });
      return response.data?.members || [];
    } catch (error) {
      console.error('Set party error:', error);
      throw error;
    }
  }
}

export const partyService = new PartyService();
