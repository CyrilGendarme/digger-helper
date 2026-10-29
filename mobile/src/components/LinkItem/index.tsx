import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MediaLink } from '../../types/search';
import { colors, PLATFORM_META } from '../../theme';
import styles from './styles';

interface Props {
  item: MediaLink;
  onPress: () => void;
}

const LinkItem: React.FC<Props> = ({ item, onPress }) => {
  const platform = PLATFORM_META[item.platform];
  // Bandcamp opens in the browser; YouTube / SoundCloud play in the in-app player.
  const external = item.platform === 'bandcamp';

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} on ${platform.label}`}
    >
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: `${platform.color}1F` }]}>
          <Ionicons name={platform.icon} size={24} color={platform.color} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.meta}>
          <Ionicons name={platform.icon} size={13} color={platform.color} />
          <Text style={styles.metaText} numberOfLines={1}>
            {[item.channel || platform.label, item.duration].filter(Boolean).join(' · ')}
          </Text>
          {item.price && (
            <View style={styles.price}>
              <Text style={styles.priceText}>{item.price}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.action}>
        <Ionicons
          name={external ? 'open-outline' : 'play'}
          size={external ? 16 : 15}
          color={colors.text}
          style={external ? undefined : styles.playIcon}
        />
      </View>
    </Pressable>
  );
};

export default LinkItem;
