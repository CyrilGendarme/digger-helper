import { StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── List ──────────────────────────────────────────────
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    ...type.caption,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    ...type.overline,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowType: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowText: {
    ...type.body,
    fontSize: 17,
    fontWeight: '600',
  },
  rowTextSkipped: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  typeBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Empty state ───────────────────────────────────────
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...type.title,
    textAlign: 'center',
  },
  emptyText: {
    ...type.caption,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },

  // ── Footer ────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  footerButton: {
    flex: 1,
  },

  // ── Sheets ────────────────────────────────────────────
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  optionText: {
    ...type.body,
    fontWeight: '600',
    flex: 1,
  },
  textInput: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  sheetButton: {
    marginTop: spacing.md,
  },
});

export default styles;
