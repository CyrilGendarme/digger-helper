import { API_BASE_URL, getAuthHeaders } from './api';
import { DiscogsSearchResponse } from '../types/record';

interface DiscogsQuery {
  artist?: string;
  album?: string;
  catno?: string;
  limit?: number;
}

export async function searchDiscogs(query: DiscogsQuery): Promise<DiscogsSearchResponse> {
  const params = new URLSearchParams();
  if (query.artist) params.set('artist', query.artist);
  if (query.album) params.set('album', query.album);
  if (query.catno) params.set('catno', query.catno);
  if (query.limit) params.set('limit', String(query.limit));

  const response = await fetch(`${API_BASE_URL}/discogs/search?${params.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Discogs search failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<DiscogsSearchResponse>;
}
