import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { colors, PLATFORM_META } from '../../theme';
import styles from './styles';

type PlayerRoute = RouteProp<RootStackParamList, 'Player'>;

// ── URL helpers ──────────────────────────────────────────────────────────────

/** Extract YouTube video ID from any youtube.com or youtu.be URL. */
function youtubeVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Build an embed URL suitable for WebView. */
function buildEmbedUrl(url: string, platform: string): string {
  if (platform === 'youtube') {
    const id = youtubeVideoId(url);
    if (id) {
      return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&fs=1`;
    }
  }
  if (platform === 'soundcloud') {
    const encoded = encodeURIComponent(url);
    return (
      `https://w.soundcloud.com/player/?url=${encoded}` +
      `&color=%23ff5500&auto_play=true&show_artwork=true&visual=true`
    );
  }
  return url;
}

/**
 * Injected into YouTube's embed page (loaded as URI, so origin = youtube.com).
 * Watches for `.ytp-error` appearing in the DOM — YouTube's own error overlay —
 * then notifies React Native. MutationObserver + interval backup covers all timing.
 */
const YT_ERROR_WATCHER = `(function() {
  var sent = false;
  function notify() {
    if (sent) return;
    sent = true;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ytBlocked' }));
  }
  function check() {
    if (
      document.querySelector('.ytp-error') ||
      document.querySelector('.ytp-error-content') ||
      document.querySelector('[class*="ytp-error"]')
    ) { notify(); return true; }
    return false;
  }
  var obs = new MutationObserver(function() { check(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  var t = setInterval(function() { if (check()) clearInterval(t); }, 600);
  true;
})();
`;

// ── Component ─────────────────────────────────────────────────────────────────
const PlayerModal: React.FC = () => {
  const navigation = useNavigation();
  const { params } = useRoute<PlayerRoute>();
  const { url, title, platform } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const embedUrl = buildEmbedUrl(url, platform);
  const platformMeta = PLATFORM_META[platform];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Close player"
        >
          <Ionicons name="chevron-down" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(url)}
          style={styles.iconBtn}
          accessibilityRole="link"
          accessibilityLabel={`Open in ${platformMeta.label}`}
        >
          <Ionicons name="open-outline" size={19} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* ── Player ── */}
      <View style={styles.playerWrapper}>
        {loading && !error && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        {error || embedBlocked ? (
          <View style={styles.errorContainer}>
            {embedBlocked ? (
              <>
                <Ionicons name="eye-off-outline" size={32} color={colors.textMuted} />
                <Text style={styles.errorTitle}>Can't play this here</Text>
                <Text style={styles.errorText}>
                  The owner has turned off playback outside YouTube.
                </Text>
                <TouchableOpacity
                  style={styles.watchOnYouTubeBtn}
                  onPress={() => Linking.openURL(url)}
                >
                  <Ionicons name="logo-youtube" size={18} color="#fff" />
                  <Text style={styles.watchOnYouTubeBtnText}>Watch on YouTube</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.openExternalBtn}
                  onPress={() => Linking.openURL(url)}
                >
                  <Ionicons name="open-outline" size={17} color="#fff" />
                  <Text style={styles.openExternalBtnText}>Open in browser</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            style={styles.webview}
            originWhitelist={['*']}
            source={{ uri: embedUrl }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            injectedJavaScript={platform === 'youtube' ? YT_ERROR_WATCHER : undefined}
            onMessage={(e) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data);
                if (msg.type === 'ytBlocked') {
                  setLoading(false);
                  setEmbedBlocked(true);
                }
              } catch (_) {}
            }}
            onLoadStart={() => { setLoading(true); setError(null); setEmbedBlocked(false); }}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => {
              setLoading(false);
              setError(`Failed to load player: ${e.nativeEvent.description}`);
            }}
            onNavigationStateChange={(state: WebViewNavigation) => {
              // Prevent the WebView from navigating away from the embed
              const allowed =
                state.url.startsWith('about:') ||
                state.url.includes('youtube.com') ||
                state.url.includes('youtu.be') ||
                state.url.includes('soundcloud.com') ||
                state.url.includes('w.soundcloud.com');
              if (!allowed && webViewRef.current) {
                webViewRef.current.stopLoading();
                Linking.openURL(state.url);
              }
            }}
          />
        )}
      </View>

      {/* ── Platform badge ── */}
      <View style={styles.footer}>
        <View style={[styles.platformBadge, { backgroundColor: `${platformMeta.color}22` }]}>
          <Ionicons name={platformMeta.icon} size={14} color={platformMeta.color} />
          <Text style={[styles.platformBadgeText, { color: platformMeta.color }]}>
            {platformMeta.label}
          </Text>
        </View>
        <Text style={styles.footerUrl} numberOfLines={1}>{url}</Text>
      </View>
    </SafeAreaView>
  );
};

export default PlayerModal;

