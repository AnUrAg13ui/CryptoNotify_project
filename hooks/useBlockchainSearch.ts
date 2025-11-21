"use client";

import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { getBlockchains } from '@/lib/api';
import type { Blockchain } from '@/types/blockchain';
import { useToast } from './use-toast';

export function useBlockchainSearch(itemsPerPage: number = 20) {
  const { toast } = useToast();
  const [blockchains, setBlockchains] = useState<Blockchain[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 500);

  const fetchBlockchains = useCallback(async (
    currentPage: number,
    searchTerm?: string,
    reset: boolean = false
  ) => {
    if (loading) return;

    try {
      setError(null);
      setLoading(true);
      
      const data = await getBlockchains(currentPage, itemsPerPage, searchTerm);
      
      setBlockchains(prev => {
        if (reset) return data;
        
        
        const newBlockchains = [...prev];
        data.forEach(blockchain => {
          if (!newBlockchains.some(existing => existing.id === blockchain.id)) {
            newBlockchains.push(blockchain);
          }
        });
        return newBlockchains;
      });
      
      setHasMore(data.length === itemsPerPage);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch blockchains';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, loading, toast]);

  return {
    blockchains,
    search,
    setSearch,
    loading,
    hasMore,
    error,
    page,
    setPage,
    debouncedSearch,
    fetchBlockchains
  };
}