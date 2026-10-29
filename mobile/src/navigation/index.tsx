import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center' }}>
        <ActivityIndicator color="#E63946" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppStack.Navigator
          initialRouteName="Capture"
          screenOptions={{ headerStyle: { backgroundColor: '#111' }, headerTintColor: '#fff' }}
        >
          <AppStack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Scan Record Ref' }} />
          <AppStack.Screen name="Label" component={LabelScreen} options={{ title: 'Label Fields' }} />
          <AppStack.Screen name="Info" component={InfoScreen} options={{ title: 'Record Info' }} />
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
