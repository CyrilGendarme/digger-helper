export type Platform = 'youtube' | 'soundcloud' | 'bandcamp';

export interface MediaLink {
  platform: Platform;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  channel?: string;
  price?: string;
}

export interface MediaSearchResponse {
  links: MediaLink[];
}
