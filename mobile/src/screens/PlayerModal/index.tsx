import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(url)}
          style={styles.externalBtn}
        >
          <Text style={styles.externalBtnText}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* ── Player ── */}
      <View style={styles.playerWrapper}>
        {loading && !error && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#E63946" />
          </View>
        )}

        {error || embedBlocked ? (
          <View style={styles.errorContainer}>
            {embedBlocked ? (
              <>
                <Text style={styles.errorTitle}>Embedding disabled</Text>
                <Text style={styles.errorText}>
                  The video owner has turned off embedded playback.
                </Text>
                <TouchableOpacity
                  style={styles.watchOnYouTubeBtn}
                  onPress={() => Linking.openURL(url)}
                >
                  <Text style={styles.watchOnYouTubeBtnText}>Watch on YouTube ↗</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.openExternalBtn}
                  onPress={() => Linking.openURL(url)}
                >
                  <Text style={styles.openExternalBtnText}>Open in browser ↗</Text>
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
        <View
          style={[
            styles.platformBadge,
            { backgroundColor: platform === 'youtube' ? '#FF0000' : '#FF5500' },
          ]}
        >
          <Text style={styles.platformBadgeText}>{platform.toUpperCase()}</Text>
        </View>
        <Text style={styles.footerUrl} numberOfLines={1}>{url}</Text>
      </View>
    </SafeAreaView>
  );
};

export default PlayerModal;

