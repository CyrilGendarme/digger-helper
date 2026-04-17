import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MediaLink } from '../../types/search';
import styles from './styles';

interface Props {
  item: MediaLink;
  onPress: () => void;
}

const PLATFORM_COLOR: Record<string, string> = {
  youtube: '#FF0000',
  soundcloud: '#FF5500',
  bandcamp: '#1DA0C3',
};

const PLATFORM_ICON: Record<string, string> = {
  youtube: '▶️',
  soundcloud: '☁️',
  bandcamp: '🎵',
};

const LinkItem: React.FC<Props> = ({ item, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
    {/* Thumbnail */}
    {item.thumbnail ? (
      <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
    ) : (
      <View style={[styles.thumb, styles.thumbPlaceholder]}>
        <Text style={{ fontSize: 22 }}>{PLATFORM_ICON[item.platform] ?? '🎵'}</Text>
      </View>
    )}

    {/* Text */}
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.bottom}>
        <View style={[styles.badge, { backgroundColor: PLATFORM_COLOR[item.platform] ?? '#444' }]}>
          <Text style={styles.badgeText}>{item.platform.toUpperCase()}</Text>
        </View>
        {item.channel && (
          <Text style={styles.channel} numberOfLines={1}>{item.channel}</Text>
        )}
        {item.duration && (
          <Text style={styles.duration}>{item.duration}</Text>
        )}
        {item.price && (
          <Text style={styles.price}>{item.price}</Text>
        )}
      </View>
    </View>

    {/* Play arrow */}
    <Text style={styles.arrow}>▶</Text>
  </TouchableOpacity>
);

export default LinkItem;
