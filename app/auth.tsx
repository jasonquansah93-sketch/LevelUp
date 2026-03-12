import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

type Mode = 'login' | 'signup' | 'email';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [emailMode, setEmailMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { login, signup } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSocialAuth = async (provider: 'apple' | 'google') => {
    setError('');
    setLoadingProvider(provider);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const mockEmail = provider === 'apple' ? 'user@icloud.com' : 'user@gmail.com';
      const mockName = provider === 'apple' ? 'Apple User' : 'Google User';
      await signup(mockEmail, 'password', mockName);
      router.replace('/onboarding/intro');
    } catch (e: any) {
      setError('Could not sign in. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (emailMode === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (emailMode === 'login') {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password, name.trim());
      }
      router.replace('/onboarding/intro');
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'email'
              ? (emailMode === 'signup' ? 'Create Account' : 'Welcome Back')
              : 'Get Started'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'email'
              ? (emailMode === 'signup' ? 'Start building your strongest self.' : 'Pick up where you left off.')
              : 'Choose how you want to continue.'}
          </Text>
        </View>

        <View style={styles.mockBanner}>
          <MaterialIcons name="info-outline" size={14} color={Colors.gold} />
          <Text style={styles.mockText}>Mock login — tap any option to continue</Text>
        </View>

        {mode !== 'email' ? (
          <>
            {/* Apple Sign In */}
            <Pressable
              style={({ pressed }) => [styles.socialBtn, styles.appleBtn, pressed && styles.pressed]}
              onPress={() => handleSocialAuth('apple')}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'apple' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="apple" size={22} color="#fff" />
                  <Text style={[styles.socialBtnText, { color: '#fff' }]}>Continue with Apple</Text>
                </>
              )}
            </Pressable>

            {/* Google Sign In */}
            <Pressable
              style={({ pressed }) => [styles.socialBtn, styles.googleBtn, pressed && styles.pressed]}
              onPress={() => handleSocialAuth('google')}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'google' ? (
                <ActivityIndicator color={Colors.textPrimary} size="small" />
              ) : (
                <>
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={[styles.socialBtnText, { color: Colors.textPrimary }]}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.emailBtn, pressed && styles.pressed]}
              onPress={() => setMode('email')}
            >
              <MaterialIcons name="email" size={20} color={Colors.textSecondary} />
              <Text style={styles.emailBtnText}>Continue with Email</Text>
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Already have an account?</Text>
              <Pressable onPress={() => { setMode('email'); setEmailMode('login'); }} hitSlop={8}>
                <Text style={styles.switchBtn}>Sign In</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* Email Form */}
            <View style={styles.form}>
              {emailMode === 'signup' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Your Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Alex"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              )}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="alex@example.com"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="6+ characters"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleEmailSubmit}
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowPass(!showPass)} hitSlop={8}>
                    <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed, loading && styles.disabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                ) : (
                  <Text style={styles.submitText}>{emailMode === 'signup' ? 'Create Account' : 'Sign In'}</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {emailMode === 'signup' ? 'Already have an account?' : 'New here?'}
              </Text>
              <Pressable onPress={() => setEmailMode(emailMode === 'signup' ? 'login' : 'signup')} hitSlop={8}>
                <Text style={styles.switchBtn}>{emailMode === 'signup' ? 'Sign In' : 'Create Account'}</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setMode('login')} style={styles.backToOptions} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={14} color={Colors.textMuted} />
              <Text style={styles.backToOptionsText}>Other sign-in options</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: Spacing.xl },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, marginLeft: -Spacing.sm },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  mockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.sm, padding: Spacing.sm,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.gold + '30',
  },
  mockText: { fontSize: FontSize.xs, color: Colors.gold, flex: 1 },
  socialBtn: {
    height: 56, borderRadius: Radius.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: Spacing.sm,
  },
  appleBtn: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  googleBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  socialBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  googleIcon: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  googleIconText: { fontSize: 13, fontWeight: FontWeight.bold, color: '#4285F4' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.surfaceBorder },
  dividerText: { fontSize: FontSize.sm, color: Colors.textMuted },
  emailBtn: {
    height: 52, borderRadius: Radius.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.surface,
  },
  emailBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  form: { gap: Spacing.md, marginBottom: Spacing.xl },
  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginLeft: 2 },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.surfaceBorder, height: 52, paddingHorizontal: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.errorSoft, borderRadius: Radius.sm, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.error + '40',
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, flex: 1 },
  submitBtn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs,
  },
  submitText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  disabled: { opacity: 0.6 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  switchLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  switchBtn: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },
  backToOptions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: Spacing.md },
  backToOptionsText: { fontSize: FontSize.sm, color: Colors.textMuted },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
