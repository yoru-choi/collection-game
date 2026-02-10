import { httpClient } from './api/HttpClient';
import { ApiResponse, User } from '@/types';

export class UserService {
  async getProfile(): Promise<User | null> {
    try {
      const response = await httpClient.get<ApiResponse<User>>('/user/profile');
      return response.data || null;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User | null> {
    try {
      const response = await httpClient.put<ApiResponse<User>>('/user/profile', updates);
      return response.data || null;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async getInventory(): Promise<any> {
    try {
      const response = await httpClient.get<ApiResponse<any>>('/user/inventory');
      return response.data || [];
    } catch (error) {
      console.error('Get inventory error:', error);
      return [];
    }
  }
}

export const userService = new UserService();
