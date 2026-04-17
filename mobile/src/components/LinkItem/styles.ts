import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 12,
  },
  thumb: {
    width: 72,
    height: 48,
    borderRadius: 6,
  },
  thumbPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  channel: {
    color: '#888',
    fontSize: 11,
    flex: 1,
  },
  duration: {
    color: '#555',
    fontSize: 11,
  },
  price: {
    color: '#1DA0C3',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  arrow: {
    color: '#444',
    fontSize: 16,
  },
});

export default styles;
