import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
// 16:9 ratio for the video area
const PLAYER_HEIGHT = Math.round((width * 9) / 16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  externalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalBtnText: {
    color: '#aaa',
    fontSize: 16,
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
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  watchOnYouTubeBtn: {
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  watchOnYouTubeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  openExternalBtn: {
    backgroundColor: '#E63946',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  openExternalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  platformBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  platformBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  footerUrl: {
    flex: 1,
    color: '#555',
    fontSize: 11,
  },
});

export default styles;
