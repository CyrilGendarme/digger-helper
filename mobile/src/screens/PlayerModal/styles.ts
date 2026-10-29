import { StyleSheet, Dimensions } from 'react-native';
import { colors, radius, spacing, type } from '../../theme';

const { width } = Dimensions.get('window');
// 16:9 ratio for the video area
const PLAYER_HEIGHT = Math.round((width * 9) / 16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...type.heading,
    flex: 1,
    fontSize: 15,
    textAlign: 'center',
  },

  // ── Player area ───────────────────────────────────────────
  playerWrapper: {
    width,
    height: PLAYER_HEIGHT,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },

  // ── Error state ───────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    ...type.heading,
    textAlign: 'center',
  },
  errorText: {
    ...type.caption,
    fontSize: 14,
    textAlign: 'center',
  },
  watchOnYouTubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FF0000',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  watchOnYouTubeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  openExternalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerUrl: {
    flex: 1,
    color: colors.textFaint,
    fontSize: 12,
  },
});

export default styles;
