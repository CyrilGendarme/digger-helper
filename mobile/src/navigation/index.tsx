import React from 'react';
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

const AppStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppStack.Navigator
          initialRouteName="Capture"
          screenOptions={{ headerStyle: { backgroundColor: '#111' }, headerTintColor: '#fff' }}
        >
          <AppStack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Scan Sleeve' }} />
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
