import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { FieldType } from './types/record';
import type { Platform as MediaPlatform } from './types/search';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Design tokens — every screen and component pulls colors and sizes from here. */
export const colors = {
  bg: '#0B0B0F',
  surface: '#15151C',
  surfaceRaised: '#1E1E27',
  surfacePressed: '#272732',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',

  text: '#F4F4F6',
  textMuted: '#A3A3AE',
  textFaint: '#6C6C78',

  accent: '#FF5A4E',
  accentPressed: '#E8483D',
  accentSoft: 'rgba(255,90,78,0.14)',

  success: '#3DDC97',
  successSoft: 'rgba(61,220,151,0.12)',
  danger: '#FF5C70',
  dangerSoft: 'rgba(255,92,112,0.12)',

  overlay: 'rgba(5,5,8,0.62)',
  scrim: 'rgba(0,0,0,0.6)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
} as const;

/** Label field types: display name, icon and color used across the Label flow. */
export const FIELD_META: Record<FieldType, { label: string; icon: IconName; color: string }> = {
  artist_name: { label: 'Artist', icon: 'person', color: '#FF6B6B' },
  album_name: { label: 'Album', icon: 'disc', color: '#FFB547' },
  record_ref: { label: 'Catalog ref', icon: 'barcode', color: '#5BA8FF' },
  unknown: { label: 'Skip', icon: 'remove-circle-outline', color: '#5C5C68' },
};

export const PLATFORM_META: Record<MediaPlatform, { label: string; icon: IconName; color: string }> = {
  youtube: { label: 'YouTube', icon: 'logo-youtube', color: '#FF3B30' },
  soundcloud: { label: 'SoundCloud', icon: 'cloud', color: '#FF7A1A' },
  bandcamp: { label: 'Bandcamp', icon: 'musical-notes', color: '#3FB6D8' },
};
