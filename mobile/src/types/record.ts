export type FieldType =
  | 'artist_name'
  | 'album_name'
  | 'record_ref'
  | 'unknown';

export interface LabelledField {
  text: string;
  fieldType: FieldType;
}

export interface RecordInfo {
  artist_name?: string;
  album_name?: string;
  record_ref?: string;
}

// ── Discogs ──────────────────────────────────────────────────────────────
export interface DiscogsTrack {
  position?: string;
  title: string;
  duration?: string;
}

export interface PriceStats {
  currency?: string;
  num_for_sale?: number;
  lowest?: number;
}

export interface DiscogsResult {
  id: number;
  title: string;
  artist?: string;
  year?: string;
  label?: string;
  catno?: string;
  format?: string;
  cover_image?: string;
  resource_url: string;
  tracklist: DiscogsTrack[];
  price_stats?: PriceStats;
}

export interface DiscogsSearchResponse {
  results: DiscogsResult[];
  total: number;
}
