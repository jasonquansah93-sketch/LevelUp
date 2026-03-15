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

type Screen = 'main' | 'email-signup' | 'email-login' | 'otp-sent';

export default function AuthScreen() {
  const [screen, setScreen] = useState<Screen>('main');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { login, signup, sendOTP, verifyOTP } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const clearError = () => setError('');

  // Apple / Google — social auth is scaffolded; shows info since OAuth requires additional setup
  const handleSocialAuth = async (provider: 'apple' | 'google') => {
    clearError();
    setLoadingProvider(provider);
    try {
      // Social OAuth requires Google to be enabled in OnSpace Cloud dashboard.
      // Scaffold: treat as email+password with a placeholder social account.
      await new Promise((r) => setTimeout(r, 800));
      setError(
        provider === 'apple'
          ? 'Apple Sign-In requires additional configuration. Use Email to continue.'
          : 'Google Sign-In requires Google OAuth to be enabled in OnSpace Cloud. Use Email to continue.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleEmailSignup = async () => {
    clearError();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    console.log('[AuthScreen] handleEmailSignup started for:', email.trim().toLowerCase());
    try {
      await signup(email.trim().toLowerCase(), password, name.trim());
      console.log('[AuthScreen] signup() resolved — redirecting to onboarding');
      // Explicitly redirect after successful signup.
      // The auth state listener in app/index.tsx also handles this,
      // but we redirect here too so there is no delay or missed state change.
      router.replace('/onboarding/intro');
    } catch (e: any) {
      console.error('[AuthScreen] signup error:', e.message);
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    clearError();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setLoading(true);
    console.log('[AuthScreen] handleEmailLogin started for:', email.trim().toLowerCase());
    try {
      await login(email.trim().toLowerCase(), password);
      console.log('[AuthScreen] login() resolved — auth state listener will redirect');
      // The onAuthStateChange listener in AuthContext + app/index.tsx handles redirect.
      // No explicit router.replace here; let index.tsx decide based on isOnboarded.
    } catch (e: any) {
      console.error('[AuthScreen] login error:', e.message);
      const msg = e.message || '';
      if (msg.toLowerCase().includes('invalid login')) {
        setError('Incorrect email or password.');
      } else {
        setError(msg || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    clearError();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      await sendOTP(email.trim().toLowerCase());
      setScreen('otp-sent');
    } catch (e: any) {
      setError(e.message || 'Could not send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    clearError();
    if (otpCode.length < 4) { setError('Please enter the verification code.'); return; }
    setLoading(true);
    try {
      await verifyOTP(email.trim().toLowerCase(), otpCode.trim());
      // Redirect happens automatically via auth state change
    } catch (e: any) {
      setError(e.message || 'Invalid code. Please try again.');
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
        <Pressable
          onPress={() => {
            if (screen === 'main') router.back();
            else if (screen === 'otp-sent') setScreen('main');
            else setScreen('main');
            clearError();
          }}
          style={styles.backBtn}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {screen === 'main' && 'Get Started'}
            {screen === 'email-signup' && 'Create Account'}
            {screen === 'email-login' && 'Welcome Back'}
            {screen === 'otp-sent' && 'Check Your Email'}
          </Text>
          <Text style={styles.subtitle}>
            {screen === 'main' && 'Choose how you want to continue.'}
            {screen === 'email-signup' && 'Start building your strongest self.'}
            {screen === 'email-login' && 'Pick up where you left off.'}
            {screen === 'otp-sent' && `We sent a ${4}-digit code to ${email}.`}
          </Text>
        </View>

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={14} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* MAIN screen */}
        {screen === 'main' && (
          <>
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
              onPress={() => { clearError(); setScreen('email-signup'); }}
            >
              <MaterialIcons name="email" size={20} color={Colors.textSecondary} />
              <Text style={styles.emailBtnText}>Continue with Email</Text>
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Already have an account?</Text>
              <Pressable onPress={() => { clearError(); setScreen('email-login'); }} hitSlop={8}>
                <Text style={styles.switchLink}>Sign In</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* EMAIL SIGNUP */}
        {screen === 'email-signup' && (
          <>
            <View style={styles.form}>
              <Field label="Your Name">
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(v) => { clearError(); setName(v); }}
                  placeholder="Alex"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { clearError(); setEmail(v); }}
                  placeholder="alex@example.com"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </Field>
              <Field label="Password">
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={(v) => { clearError(); setPassword(v); }}
                    placeholder="6+ characters"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleEmailSignup}
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowPass(!showPass)} hitSlop={8}>
                    <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              </Field>
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed, loading && styles.disabled]}
              onPress={handleEmailSignup}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.textInverse} size="small" /> : <Text style={styles.submitText}>Create Account</Text>}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Already have an account?</Text>
              <Pressable onPress={() => { clearError(); setScreen('email-login'); }} hitSlop={8}>
                <Text style={styles.switchLink}>Sign In</Text>
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in without password</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={({ pressed }) => [styles.otpBtn, pressed && styles.pressed]} onPress={() => { clearError(); setScreen('otp-sent'); handleSendOTP(); }}>
              <MaterialIcons name="mark-email-read" size={18} color={Colors.gold} />
              <Text style={styles.otpBtnText}>Send Magic Code</Text>
            </Pressable>
          </>
        )}

        {/* EMAIL LOGIN */}
        {screen === 'email-login' && (
          <>
            <View style={styles.form}>
              <Field label="Email">
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { clearError(); setEmail(v); }}
                  placeholder="alex@example.com"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </Field>
              <Field label="Password">
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={(v) => { clearError(); setPassword(v); }}
                    placeholder="Your password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleEmailLogin}
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowPass(!showPass)} hitSlop={8}>
                    <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              </Field>
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed, loading && styles.disabled]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.textInverse} size="small" /> : <Text style={styles.submitText}>Sign In</Text>}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>New here?</Text>
              <Pressable onPress={() => { clearError(); setScreen('email-signup'); }} hitSlop={8}>
                <Text style={styles.switchLink}>Create Account</Text>
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.otpBtn, pressed && styles.pressed]}
              onPress={() => { clearError(); handleSendOTP(); }}
              disabled={loading}
            >
              <MaterialIcons name="mark-email-read" size={18} color={Colors.gold} />
              <Text style={styles.otpBtnText}>Sign in with Magic Code</Text>
            </Pressable>
          </>
        )}

        {/* OTP SENT */}
        {screen === 'otp-sent' && (
          <>
            <View style={styles.otpIconWrap}>
              <MaterialIcons name="mark-email-read" size={48} color={Colors.gold} />
            </View>

            <View style={styles.form}>
              <Field label={`Enter ${4}-Digit Code`}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otpCode}
                  onChangeText={(v) => { clearError(); setOtpCode(v.replace(/\D/g, '').slice(0, 4)); }}
                  placeholder="0000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
                  autoFocus
                />
              </Field>
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed, (loading || otpCode.length < 4) && styles.disabled]}
              onPress={handleVerifyOTP}
              disabled={loading || otpCode.length < 4}
            >
              {loading ? <ActivityIndicator color={Colors.textInverse} size="small" /> : <Text style={styles.submitText}>Verify & Continue</Text>}
            </Pressable>

            <Pressable style={styles.resendBtn} onPress={handleSendOTP} disabled={loading} hitSlop={8}>
              <Text style={styles.resendBtnText}>Resend code</Text>
            </Pressable>
          </>
        )}

        <View style={styles.termsRow}>
          <Text style={styles.termsText}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' and '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: Spacing.xl },
  backBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg, marginLeft: -Spacing.sm,
  },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.errorSoft, borderRadius: Radius.sm, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.error + '40',
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, flex: 1, lineHeight: 20 },

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

  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.surfaceBorder },
  dividerText: { fontSize: FontSize.xs, color: Colors.textMuted },

  emailBtn: {
    height: 52, borderRadius: Radius.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.surface,
  },
  emailBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textSecondary },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: Spacing.md,
  },
  switchLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  switchLink: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },

  form: { gap: Spacing.md, marginBottom: Spacing.lg },
  field: { gap: Spacing.xs },
  fieldLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.textSecondary, marginLeft: 2,
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.surfaceBorder, height: 52, paddingHorizontal: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },

  submitBtn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  disabled: { opacity: 0.55 },

  otpBtn: {
    height: 50, borderRadius: Radius.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.gold + '50', backgroundColor: Colors.goldSoft,
  },
  otpBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gold },

  otpIconWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
  otpInput: {
    textAlign: 'center', fontSize: 28, fontWeight: FontWeight.bold,
    letterSpacing: 12, height: 64,
  },
  resendBtn: { alignItems: 'center', marginTop: Spacing.md },
  resendBtnText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },

  termsRow: { marginTop: Spacing.xl },
  termsText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.textSecondary, fontWeight: FontWeight.medium },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
