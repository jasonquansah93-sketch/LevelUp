import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function Entry() {
  const { user, isLoading, isOnboarded } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) {
      console.log('[Entry] Still loading auth state...');
      return;
    }

    if (hasRedirected.current) return;

    if (!user) {
      console.log('[Entry] No user — redirecting to /welcome');
      hasRedirected.current = true;
      router.replace('/welcome');
    } else if (!isOnboarded) {
      console.log('[Entry] User authenticated but not onboarded — redirecting to /onboarding/intro');
      hasRedirected.current = true;
      router.replace('/onboarding/intro');
    } else {
      console.log('[Entry] User authenticated and onboarded — redirecting to /(tabs)');
      hasRedirected.current = true;
      router.replace('/(tabs)');
    }
  }, [user, isLoading, isOnboarded]);

  // Reset the redirect guard when loading changes back to true (e.g., logout then re-login)
  useEffect(() => {
    if (isLoading) {
      hasRedirected.current = false;
    }
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.gold} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
