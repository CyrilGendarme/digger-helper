import { API_BASE_URL, getAuthHeaders } from './api';
import { MediaSearchResponse } from '../types/search';

interface MediaSearchQuery {
  artist: string;
  record: string;
  record_ref?: string;
  limit?: number;
}

export async function searchMedia(query: MediaSearchQuery): Promise<MediaSearchResponse> {
  const params = new URLSearchParams();
  params.set('artist', query.artist);
  params.set('record', query.record);
  if (query.record_ref) params.set('record_ref', query.record_ref);
  params.set('limit', String(query.limit ?? 5));
  const response = await fetch(`${API_BASE_URL}/search/media?${params.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Media search failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<MediaSearchResponse>;
}
