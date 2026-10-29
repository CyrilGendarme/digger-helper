import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, SectionList, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../store';
import { useDiscogs } from '../../hooks/useDiscogs';
import Button from '../../components/Button';
import RecordCard from '../../components/RecordCard';
import LinkItem from '../../components/LinkItem';
import { LabelledField, RecordInfo, DiscogsResult } from '../../types/record';
import { MediaLink } from '../../types/search';
import type { RootStackParamList } from '../../navigation/types';
import { colors, FIELD_META, spacing, type IconName } from '../../theme';
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

interface Section {
  key: string;
  title: string;
  icon: IconName;
  loading: boolean;
  loadingText: string;
  error: string | null;
  emptyText: string;
  data: (DiscogsResult | MediaLink)[];
}

const InfoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
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

  const isBusy = discogsLoading || mediaLoading;
  // The media search starts once Discogs has answered, so it is pending meanwhile.
  const mediaPending = discogsLoading || mediaLoading;
  const refresh = () => {
    if (!isBusy) fetchAll(recordInfo);
  };

  const handleLinkPress = (link: MediaLink) => {
    if (link.platform === 'bandcamp') {
      Linking.openURL(link.url);
      return;
    }
    navigation.navigate('Player', { url: link.url, title: link.title, platform: link.platform });
  };

  // ── Section list data ────────────────────────────────────────────────────
  const sections: Section[] = [
    {
      key: 'discogs',
      title: 'Discogs',
      icon: 'disc',
      loading: discogsLoading,
      loadingText: 'Looking up the release…',
      error: discogsError,
      emptyText: 'No matching release on Discogs.',
      data: discogsResults,
    },
    {
      key: 'media',
      title: 'Listen',
      icon: 'headset',
      loading: mediaPending,
      loadingText: 'Searching YouTube & SoundCloud…',
      error: mediaError,
      emptyText: 'Nothing found on YouTube or SoundCloud.',
      data: mediaLinks.filter((l) => l.platform !== 'bandcamp'),
    },
    {
      key: 'bandcamp',
      title: 'Buy on Bandcamp',
      icon: 'cart',
      loading: mediaPending,
      loadingText: 'Searching Bandcamp…',
      error: mediaError,
      emptyText: 'Not found on Bandcamp.',
      data: mediaLinks.filter((l) => l.platform === 'bandcamp'),
    },
  ];

  const query = (['artist_name', 'album_name', 'record_ref'] as const)
    .map((key) => ({ key, text: recordInfo[key] }))
    .filter((q): q is { key: typeof q.key; text: string } => !!q.text);

  return (
    <SectionList<DiscogsResult | MediaLink, Section>
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      sections={sections}
      keyExtractor={(item, index) => {
        const { id, url } = item as { id?: number; url?: string };
        return `${id ?? url ?? index}`;
      }}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refresh}
          tintColor={colors.textMuted}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surfaceRaised}
        />
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Ionicons name={section.icon} size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {!section.loading && section.data.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{section.data.length}</Text>
            </View>
          )}
        </View>
      )}
      renderSectionFooter={({ section }) => {
        if (section.loading) {
          return (
            <View style={styles.statusCard}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.statusText}>{section.loadingText}</Text>
            </View>
          );
        }
        if (section.error) {
          return (
            <View style={[styles.statusCard, styles.errorCard]}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText} numberOfLines={4}>{section.error}</Text>
            </View>
          );
        }
        if (section.data.length === 0) {
          return (
            <View style={styles.statusCard}>
              <Ionicons name="search-outline" size={16} color={colors.textFaint} />
              <Text style={styles.statusText}>{section.emptyText}</Text>
            </View>
          );
        }
        return null;
      }}
      renderItem={({ item, section }) =>
        section.key === 'discogs' ? (
          <RecordCard result={item as DiscogsResult} />
        ) : (
          <LinkItem item={item as MediaLink} onPress={() => handleLinkPress(item as MediaLink)} />
        )
      }
      ListHeaderComponent={
        <View style={styles.queryBar}>
          {query.map(({ key, text }) => (
            <View key={key} style={styles.queryChip}>
              <Ionicons name={FIELD_META[key].icon} size={13} color={FIELD_META[key].color} />
              <Text style={styles.queryText} numberOfLines={1}>{text}</Text>
            </View>
          ))}
        </View>
      }
      ListFooterComponent={
        <Button
          label="Search again"
          icon="refresh"
          variant="ghost"
          onPress={refresh}
          disabled={isBusy}
          style={styles.retry}
        />
      }
    />
  );
};

export default InfoScreen;
