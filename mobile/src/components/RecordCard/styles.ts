import { StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../../theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cover: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
  },
  coverPlaceholder: {
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...type.heading,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  artist: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.textFaint,
    fontSize: 12,
    flexShrink: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Marketplace prices ────────────────────────────────────
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
  },
  priceValue: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
  },
  priceCaption: {
    color: colors.textMuted,
    fontSize: 11,
  },
  forSale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forSaleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Tracklist ─────────────────────────────────────────────
  tracklist: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 6,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackPos: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '600',
    width: 28,
  },
  trackTitle: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  trackDuration: {
    color: colors.textFaint,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },

  // ── Footer actions ────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  actionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  actionTextAccent: {
    color: colors.accent,
  },
});

export default styles;
