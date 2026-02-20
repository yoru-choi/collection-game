import { httpClient } from './api/HttpClient';
import { ApiResponse, ShopItem } from '@/types';

type ShopItemApi = {
  id: number;
  name: string;
  description?: string | null;
  item_type: string;
  currency_type: string;
  price: number;
  stock?: number;
  daily_limit?: number;
  daily_purchased?: number;
};

export class ShopService {
  async getItems(currency?: string): Promise<ShopItem[]> {
    try {
      const url = currency ? `/shop/items?currency=${currency}` : '/shop/items';
      const response = await httpClient.get<ApiResponse<ShopItemApi[]>>(url);
      const items = response.data || [];
      return items.map((item) => this.mapItem(item));
    } catch (error) {
      console.error('Get shop items error:', error);
      return [];
    }
  }

  async purchase(itemId: string, quantity: number = 1): Promise<boolean> {
    try {
      const shopItemId = Number(itemId);
      if (Number.isNaN(shopItemId)) {
        throw new Error('Invalid shop item id');
      }
      const response = await httpClient.post<ApiResponse<void>>('/shop/purchase', {
        shop_item_id: shopItemId,
        quantity,
      });
      return response.success;
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }

  private mapItem(item: ShopItemApi): ShopItem {
    return {
      id: String(item.id),
      name: item.name,
      description: item.description || '',
      type: (item.item_type as ShopItem['type']) || 'material',
      price: item.price,
      currencyType: item.currency_type,
      stock: item.stock,
      dailyLimit: item.daily_limit,
      dailyPurchased: item.daily_purchased,
    };
  }
}

export const shopService = new ShopService();
