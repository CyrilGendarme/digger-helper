import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import CaptureScreen from '../screens/CaptureScreen';
import LabelScreen from '../screens/LabelScreen';
import InfoScreen from '../screens/InfoScreen';
import PlayerModal from '../screens/PlayerModal';
import LoginScreen from '../screens/LoginScreen';
import type { RootStackParamList, AuthStackParamList } from './types';
import type { RootState } from '../store';
import { restoreSession } from '../services/api';
import { colors } from '../theme';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
  },
};

const AppStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, restored } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    restoreSession();
  }, []);

  // Avoid flashing the passcode screen while the stored session is checked.
  if (!restored) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? (
        <AppStack.Navigator
          initialRouteName="Capture"
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerBackTitleVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <AppStack.Screen name="Capture" component={CaptureScreen} options={{ headerShown: false }} />
          <AppStack.Screen name="Label" component={LabelScreen} options={{ title: 'Review fields' }} />
          <AppStack.Screen name="Info" component={InfoScreen} options={{ title: 'Results' }} />
          <AppStack.Screen
            name="Player"
            component={PlayerModal}
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
            }}
          />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
