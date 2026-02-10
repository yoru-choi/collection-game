import { httpClient } from './api/HttpClient';
import { ApiResponse, ShopItem } from '@/types';

export class ShopService {
  async getItems(shopType?: string): Promise<ShopItem[]> {
    try {
      const url = shopType ? `/shop/items?type=${shopType}` : '/shop/items';
      const response = await httpClient.get<ApiResponse<ShopItem[]>>(url);
      return response.data || [];
    } catch (error) {
      console.error('Get shop items error:', error);
      return [];
    }
  }

  async purchase(itemId: string, quantity: number = 1): Promise<boolean> {
    try {
      const response = await httpClient.post<ApiResponse<void>>('/shop/purchase', {
        itemId,
        quantity,
      });
      return response.success;
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }
}

export const shopService = new ShopService();
