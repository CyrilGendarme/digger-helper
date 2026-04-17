import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { RootState } from '../../store';
import { useDiscogs } from '../../hooks/useDiscogs';
import RecordCard from '../../components/RecordCard';
import LinkItem from '../../components/LinkItem';
import { LabelledField, RecordInfo, DiscogsResult } from '../../types/record';
import { MediaLink } from '../../types/search';
import type { RootStackParamList } from '../../navigation/types';
import styles from './styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Info'>;

/** Collapse all labelled fields into a single RecordInfo object. */
function buildRecordInfo(fields: LabelledField[], manualFields: LabelledField[]): RecordInfo {
  const all = [...fields, ...manualFields];
  const pick = (type: LabelledField['fieldType']) =>
    all.find((f) => f.fieldType === type)?.text;

  return {
    artist_name: pick('artist_name'),
    album_name: pick('album_name'),
    record_ref: pick('record_ref'),
  };
}

const InfoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { fields, manualFields } = useSelector((state: RootState) => state.label);
  const {
    discogsLoading, discogsError, discogsResults,
    mediaLoading, mediaError, mediaLinks,
    fetchAll,
  } = useDiscogs();

  const recordInfo = useMemo(
    () => buildRecordInfo(fields, manualFields),
    [fields, manualFields],
  );

  // Kick off the chained fetch (Discogs first, then media with first-result metadata).
  // hasFetched ref prevents React StrictMode's double-invoke from firing twice.
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll(recordInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLinkPress = (link: MediaLink) => {
    if (link.platform === 'bandcamp') {
      Linking.openURL(link.url);
      return;
    }
    navigation.navigate('Player', { url: link.url, title: link.title, platform: link.platform });
  };

  // ── Section list data ────────────────────────────────────────────────────
  const bandcampLinks = mediaLinks.filter((l) => l.platform === 'bandcamp');
  const streamLinks   = mediaLinks.filter((l) => l.platform !== 'bandcamp');

  const sections = [
    {
      key: 'discogs',
      title: '💿 Discogs results',
      loading: discogsLoading,
      error: discogsError,
      data: discogsResults,
      renderItem: ({ item }: { item: unknown }) => (
        <RecordCard result={item as DiscogsResult} />
      ),
    },
    {
      key: 'bandcamp',
      title: '🎵 Bandcamp',
      loading: mediaLoading,
      error: mediaError,
      data: bandcampLinks,
      renderItem: ({ item }: { item: unknown }) => (
        <LinkItem item={item as MediaLink} onPress={() => handleLinkPress(item as MediaLink)} />
      ),
    },
    {
      key: 'media',
      title: '🎬 YouTube & SoundCloud',
      loading: mediaLoading,
      error: mediaError,
      data: streamLinks,
      renderItem: ({ item }: { item: unknown }) => (
        <LinkItem item={item as MediaLink} onPress={() => handleLinkPress(item as MediaLink)} />
      ),
    },
  ];

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.content}
      sections={sections.map((s) => ({ ...s, data: s.data as object[] }))}
      keyExtractor={(item, index) => `${(item as { id?: number }).id ?? index}`}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => {
        const s = section as typeof sections[number];
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {s.loading && <ActivityIndicator size="small" color="#E63946" />}
          </View>
        );
      }}
      renderSectionFooter={({ section }) => {
        const s = section as typeof sections[number];
        if (s.loading) return null;
        if (s.error) {
          return (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{s.error}</Text>
            </View>
          );
        }
        if (s.data.length === 0) {
          return <Text style={styles.emptyText}>No results found.</Text>;
        }
        return null;
      }}
      renderItem={({ item, section }) => {
        const s = section as typeof sections[number];
        return s.renderItem({ item });
      }}
      ListHeaderComponent={
        <View style={styles.infoBar}>
          {recordInfo.artist_name && (
            <Text style={styles.infoChip}>🎤 {recordInfo.artist_name}</Text>
          )}
          {recordInfo.album_name && (
            <Text style={styles.infoChip}>💿 {recordInfo.album_name}</Text>
          )}
          {recordInfo.record_ref && (
            <Text style={styles.infoChip}>🔖 {recordInfo.record_ref}</Text>
          )}
        </View>
      }
      ListFooterComponent={
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            fetchAll(recordInfo);
          }}
        >
          <Text style={styles.retryText}>↻ Refresh</Text>
        </TouchableOpacity>
      }
    />
  );
};

export default InfoScreen;

