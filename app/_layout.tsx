import { AlertProvider } from '@/template';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/contexts/GameContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <GameProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F0F13' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding/intro" />
              <Stack.Screen name="onboarding/avatar" />
              <Stack.Screen name="onboarding/categories" />
              <Stack.Screen name="onboarding/quests" />
              <Stack.Screen name="onboarding/targets" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </GameProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
