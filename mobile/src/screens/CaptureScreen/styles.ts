import { StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../../theme';

const SHUTTER = 78;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },

  // ── Bottom controls ───────────────────────────────────────
  controls: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -radius.xl,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shutter: {
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: SHUTTER / 2,
    borderWidth: 4,
    borderColor: colors.text,
    padding: 5,
  },
  shutterPressed: {
    transform: [{ scale: 0.94 }],
  },
  shutterInner: {
    flex: 1,
    borderRadius: SHUTTER / 2,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInnerBusy: {
    backgroundColor: colors.accentPressed,
  },
  sideAction: {
    width: 72,
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  sideIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideIconActive: {
    backgroundColor: colors.text,
  },
  sideLabel: {
    ...type.caption,
    fontSize: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
  },

  // ── Permission states ─────────────────────────────────────
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    gap: spacing.md,
    padding: spacing.xl,
  },
  permissionIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  permissionTitle: {
    ...type.title,
    textAlign: 'center',
  },
  permissionText: {
    ...type.caption,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  permissionActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});

export default styles;
