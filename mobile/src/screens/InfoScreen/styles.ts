import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // ── Query summary bar ───────────────────────────────────
  infoBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginBottom: 8,
  },
  infoChip: {
    backgroundColor: '#2a2a2a',
    color: '#ddd',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  // ── Section headers ─────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Error / empty ────────────────────────────────────────
  errorBox: {
    backgroundColor: '#3a0000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
  },
  emptyText: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // ── Refresh button ───────────────────────────────────────
  retryBtn: {
    marginTop: 24,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: {
    color: '#888',
    fontSize: 13,
  },
});

export default styles;
