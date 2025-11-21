import axios from 'axios';
import type { Blockchain } from '@/types/blockchain';
import { apiCache } from './cache';

const api = axios.create({
  baseURL: '/api/coins',
  timeout: 10000,
});

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

async function throttledRequest<T>(
  url: string,
  params: Record<string, any>
): Promise<T> {
  const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
  const cachedData = apiCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData as T;
  }

  const now = Date.now();
  const timeToWait = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastRequestTime));
  
  if (timeToWait > 0) {
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }

  const response = await api.get<T>(url, { params });
  lastRequestTime = Date.now();
  
  apiCache.set(cacheKey, response.data);
  return response.data;
}

export async function getBlockchains(
  page: number = 1,
  limit: number = 20,
  searchTerm?: string
): Promise<Blockchain[]> {
  try {
    if (searchTerm?.trim()) {
      const searchResponse = await throttledRequest<{ coins: any[] }>('/', {
        path: 'search',
        query: searchTerm.trim()
      });

      if (!Array.isArray(searchResponse?.coins)) {
        return [];
      }

      const coinIds = searchResponse.coins
        .slice(0, limit)
        .map((coin: any) => coin.id)
        .join(',');

      if (!coinIds) return [];

      const marketResponse = await throttledRequest<any[]>('/', {
        path: 'coins/markets',
        vs_currency: 'usd',
        ids: coinIds,
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false
      });

      if (!Array.isArray(marketResponse)) {
        return [];
      }

      return marketResponse.map(mapCoinToBlockchain);
    }

    const response = await throttledRequest<any[]>('/', {
      path: 'coins/markets',
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit,
      page: page,
      sparkline: false
    });

    if (!Array.isArray(response)) {
      return [];
    }

    return response.map(mapCoinToBlockchain);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch blockchain data');
    }
    throw new Error('An unexpected error occurred');
  }
}

function mapCoinToBlockchain(coin: any): Blockchain {
  return {
    id: coin.id || '',
    name: coin.name || '',
    symbol: coin.symbol || '',
    image: coin.image || '',
    current_price: typeof coin.current_price === 'number' ? coin.current_price : 0,
    price_change_percentage_24h: typeof coin.price_change_percentage_24h === 'number' ? coin.price_change_percentage_24h : 0,
    logo: coin.logo || '',
  };
}