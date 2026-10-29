import { StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl + 4,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...type.display,
    marginBottom: spacing.xs + 2,
  },
  subtitle: {
    ...type.caption,
    fontSize: 15,
    marginBottom: spacing.xxl + spacing.sm,
  },
  inputWrap: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputWrapError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    color: colors.text,
  },
  inputFilled: {
    fontWeight: '600',
    letterSpacing: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
  },
  dotFilled: {
    backgroundColor: colors.accent,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    minHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
