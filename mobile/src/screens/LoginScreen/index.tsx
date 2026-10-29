import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/Button';
import { buildApiUrl, startSession } from '../../services/api';
import { colors } from '../../theme';
import styles from './styles';

const PASSCODE_LENGTH = 10;
const PASSCODE_REGEX = /^[A-Za-z0-9]{10}$/;

const LoginScreen: React.FC = () => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!PASSCODE_REGEX.test(input)) {
      setError(`The passcode is ${PASSCODE_LENGTH} letters or numbers.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: input }),
      });

      if (!response.ok) {
        setError(response.status === 401 ? 'Wrong passcode — try again.' : `Server error (${response.status}).`);
        setInput('');
        return;
      }

      const data = await response.json();
      await startSession(data.access_token);
    } catch {
      setError("Can't reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Ionicons name="disc" size={44} color={colors.accent} />
        </View>
        <Text style={styles.title}>Digger Helper</Text>
        <Text style={styles.subtitle}>Scan a record. Hear it instantly.</Text>

        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <Ionicons name="lock-closed" size={18} color={colors.textFaint} />
          <TextInput
            style={[styles.input, input.length > 0 && styles.inputFilled]}
            value={input}
            onChangeText={(v) => {
              setError(null);
              setInput(v.replace(/[^A-Za-z0-9]/g, ''));
            }}
            secureTextEntry={!revealed}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={PASSCODE_LENGTH}
            placeholder="Passcode"
            placeholderTextColor={colors.textFaint}
            autoFocus
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
            accessibilityLabel="Passcode input"
            editable={!loading}
          />
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide passcode' : 'Show passcode'}
          >
            <Ionicons name={revealed ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* One dot per character so progress is visible while the text is hidden */}
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: PASSCODE_LENGTH }, (_, i) => (
            <View key={i} style={[styles.dot, i < input.length && styles.dotFilled]} />
          ))}
        </View>

        <Text style={styles.errorText} accessibilityRole="alert">{error ?? ' '}</Text>

        <Button
          label="Unlock"
          icon="lock-open"
          onPress={handleSubmit}
          loading={loading}
          disabled={input.length < PASSCODE_LENGTH}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
