import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
    backgroundColor: '#111',
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    gap: 16,
    padding: 24,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnPrimary: {
    backgroundColor: '#E63946',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnTextSecondary: {
    color: '#aaa',
    fontSize: 15,
  },
  errorBox: {
    maxHeight: 80,
    backgroundColor: '#3a0000',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
  },
});

export default styles;
