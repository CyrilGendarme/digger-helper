import { apiRequest } from './api';
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

  return apiRequest<MediaSearchResponse>(`/search/media?${params.toString()}`, 'Media search');
}
