import React, { useState } from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DiscogsResult, PriceStats } from '../../types/record';
import { colors } from '../../theme';
import styles from './styles';

interface Props {
  result: DiscogsResult;
}

function formatPrice(value: number, currency?: string): string {
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
    } catch {
      // Unknown currency code — fall through to the plain format.
    }
  }
  return `${currency ? `${currency} ` : ''}${value.toFixed(2)}`;
}

const PriceRow: React.FC<{ stats: PriceStats }> = ({ stats }) => (
  <View style={styles.priceRow}>
    {stats.lowest != null && (
      <View>
        <Text style={styles.priceValue}>{formatPrice(stats.lowest, stats.currency)}</Text>
        <Text style={styles.priceCaption}>lowest on Discogs</Text>
      </View>
    )}
    {stats.num_for_sale != null && (
      <View style={styles.forSale}>
        <Ionicons name="pricetags-outline" size={13} color={colors.textMuted} />
        <Text style={styles.forSaleText}>{stats.num_for_sale} for sale</Text>
      </View>
    )}
  </View>
);

const RecordCard: React.FC<Props> = ({ result }) => {
  const [expanded, setExpanded] = useState(false);
  const tags = [result.year, result.format, result.catno].filter(Boolean) as string[];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {result.cover_image ? (
          <Image source={{ uri: result.cover_image }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name="disc-outline" size={34} color={colors.textFaint} />
          </View>
        )}

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>{result.title}</Text>
          {result.artist && (
            <Text style={styles.artist} numberOfLines={1}>{result.artist}</Text>
          )}
          {result.label && (
            <View style={styles.labelRow}>
              <Ionicons name="pricetag-outline" size={12} color={colors.textFaint} />
              <Text style={styles.label} numberOfLines={1}>{result.label}</Text>
            </View>
          )}
          {tags.length > 0 && (
            <View style={styles.tags}>
              {tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {result.price_stats && <PriceRow stats={result.price_stats} />}

      {expanded && result.tracklist.length > 0 && (
        <View style={styles.tracklist}>
          {result.tracklist.map((t, i) => (
            <View key={i} style={styles.trackRow}>
              <Text style={styles.trackPos}>{t.position ?? ''}</Text>
              <Text style={styles.trackTitle} numberOfLines={1}>{t.title}</Text>
              {t.duration && <Text style={styles.trackDuration}>{t.duration}</Text>}
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {result.tracklist.length > 0 ? (
          <Pressable
            style={styles.action}
            onPress={() => setExpanded((v) => !v)}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Ionicons name={expanded ? 'chevron-up' : 'list'} size={16} color={colors.textMuted} />
            <Text style={styles.actionText}>
              {expanded ? 'Hide tracklist' : `Tracklist · ${result.tracklist.length}`}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          style={styles.action}
          onPress={() => Linking.openURL(result.resource_url)}
          hitSlop={6}
          accessibilityRole="link"
        >
          <Text style={[styles.actionText, styles.actionTextAccent]}>View on Discogs</Text>
          <Ionicons name="open-outline" size={15} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
};

export default RecordCard;
