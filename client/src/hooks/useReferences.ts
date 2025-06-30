import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Reference, SearchParams } from "@shared/schema";

export function useReferences(params: SearchParams) {
  return useQuery<{ references: Reference[], total: number }>({
    queryKey: ["/api/references", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.query) searchParams.set('query', params.query);
      if (params.tags?.length) searchParams.set('tags', params.tags.join(','));
      if (params.source) searchParams.set('source', params.source);
      searchParams.set('limit', params.limit.toString());
      searchParams.set('offset', params.offset.toString());
      
      const response = await apiRequest("GET", `/api/references?${searchParams}`);
      return response.json();
    },
  });
}

export function useCreateReference() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (referenceData: any) => {
      const response = await apiRequest("POST", "/api/references", referenceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    },
  });
}

export function useStartScraping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ source, limit }: { source?: string; limit?: number }) => {
      const response = await apiRequest("POST", "/api/scrape", { source, limit });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    },
  });
}

export function useCopyReference() {
  return useMutation({
    mutationFn: async (referenceId: number) => {
      const response = await apiRequest("POST", `/api/references/${referenceId}/copy`);
      return response.json();
    },
  });
}
