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
import styles from './styles';

const PASSCODE = process.env.EXPO_PUBLIC_PASSCODE ?? '1234';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(() => {
    if (input === PASSCODE) {
      setError(false);
      dispatch(login());
    } else {
      setError(true);
      setInput('');
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
            setInput(v);
          }}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={12}
          placeholder="••••"
          placeholderTextColor="#555"
          autoFocus
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          accessibilityLabel="Passcode input"
        />

        {error && (
          <Text style={styles.errorText} accessibilityRole="alert">
            Incorrect passcode. Try again.
          </Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Unlock"
        >
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
