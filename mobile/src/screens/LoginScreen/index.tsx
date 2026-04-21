import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store';
import { buildApiUrl, setAuthToken } from '../../services/api';
import styles from './styles';

const PASSCODE_REGEX = /^[A-Za-z0-9]{10}$/;

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!PASSCODE_REGEX.test(input)) {
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: input }),
      });

      if (!response.ok) {
        setError(true);
        setInput('');
        return;
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      dispatch(login(data.access_token));
    } catch {
      setError(true);
      setInput('');
    } finally {
      setLoading(false);
    }
  }, [input, dispatch]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Digger Helper</Text>
        <Text style={styles.subtitle}>Enter passcode to continue</Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={input}
          onChangeText={(v) => {
            setError(false);
            const cleaned = v.replace(/[^A-Za-z0-9]/g, '');
            setInput(cleaned);
          }}
          secureTextEntry
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={10}
          placeholder="A1B2C3D4E5"
          placeholderTextColor="#555"
          autoFocus
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          accessibilityLabel="Passcode input"
          editable={!loading}
        />

        {error && (
          <Text style={styles.errorText} accessibilityRole="alert">
            Passcode must be 10 letters/numbers, then match server passcode.
          </Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Unlock"
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '…' : 'Unlock'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
