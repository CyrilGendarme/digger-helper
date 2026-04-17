import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  cover: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  coverPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 28,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  artist: {
    color: '#E63946',
    fontSize: 13,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    color: '#aaa',
    fontSize: 11,
  },
  label: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  tracklistToggle: {
    marginTop: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  tracklistToggleText: {
    color: '#457B9D',
    fontSize: 13,
  },
  tracklist: {
    marginTop: 4,
    gap: 4,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackPos: {
    color: '#555',
    fontSize: 12,
    width: 28,
    textAlign: 'right',
  },
  trackTitle: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
  trackDuration: {
    color: '#555',
    fontSize: 12,
  },
  discogsLink: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  discogsLinkText: {
    color: '#F4A261',
    fontSize: 12,
  },
  // ── Marketplace prices ────────────────────────────────────────────────────
  priceSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceForSaleBadge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceForSaleText: {
    color: '#aaa',
    fontSize: 12,
  },
  priceLowest: {
    color: '#74c69d',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default styles;
