import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { DiscogsResult, DiscogsTrack, PriceStats } from '../../types/record';
import styles from './styles';

interface Props {
  result: DiscogsResult;
}

const fmt = (val?: number, currency?: string) =>
  val == null ? '—' : `${currency ?? ''}${val.toFixed(2)}`;

const PriceRow: React.FC<{ stats: PriceStats }> = ({ stats }) => (
  <View style={styles.priceSection}>
    <View style={styles.priceRow}>
      {stats.num_for_sale != null && (
        <View style={styles.priceForSaleBadge}>
          <Text style={styles.priceForSaleText}>{stats.num_for_sale} for sale</Text>
        </View>
      )}
      {stats.lowest != null && (
        <Text style={styles.priceLowest}>
          from {fmt(stats.lowest, stats.currency)}
        </Text>
      )}
    </View>
  </View>
);

const RecordCard: React.FC<Props> = ({ result }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {result.cover_image ? (
          <Image source={{ uri: result.cover_image }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>💿</Text>
          </View>
        )}

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>{result.title}</Text>
          {result.artist && (
            <Text style={styles.artist} numberOfLines={1}>{result.artist}</Text>
          )}
          <View style={styles.tags}>
            {result.year && <View style={styles.tag}><Text style={styles.tagText}>{result.year}</Text></View>}
            {result.format && <View style={styles.tag}><Text style={styles.tagText}>{result.format}</Text></View>}
            {result.catno && <View style={styles.tag}><Text style={styles.tagText}>{result.catno}</Text></View>}
          </View>
          {result.label && (
            <Text style={styles.label} numberOfLines={1}>🏷 {result.label}</Text>
          )}
        </View>
      </View>

      {/* Marketplace prices */}
      {result.price_stats && <PriceRow stats={result.price_stats} />}

      {/* Tracklist toggle */}
      {result.tracklist.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.tracklistToggle}
            onPress={() => setExpanded((v) => !v)}
          >
            <Text style={styles.tracklistToggleText}>
              {expanded ? '▲ Hide tracklist' : `▼ Tracklist (${result.tracklist.length})`}
            </Text>
          </TouchableOpacity>
          {expanded && (
            <View style={styles.tracklist}>
              {result.tracklist.map((t: DiscogsTrack, i: number) => (
                <View key={i} style={styles.trackRow}>
                  {t.position && (
                    <Text style={styles.trackPos}>{t.position}</Text>
                  )}
                  <Text style={styles.trackTitle} numberOfLines={1}>{t.title}</Text>
                  {t.duration && (
                    <Text style={styles.trackDuration}>{t.duration}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <TouchableOpacity
        onPress={() => Linking.openURL(result.resource_url)}
        style={styles.discogsLink}
      >
        <Text style={styles.discogsLinkText}>View on Discogs ↗</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RecordCard;
