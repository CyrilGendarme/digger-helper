import { API_BASE_URL, getAuthHeaders } from './api';
import { MediaSearchResponse } from '../types/search';

export async function searchMedia(query: string, limit = 5): Promise<MediaSearchResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/search/media?${params.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Media search failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<MediaSearchResponse>;
}
