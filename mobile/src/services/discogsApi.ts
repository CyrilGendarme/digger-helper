import { apiRequest } from './api';
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

  return apiRequest<DiscogsSearchResponse>(`/discogs/search?${params.toString()}`, 'Discogs search');
}
