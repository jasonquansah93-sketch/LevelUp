import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { AvatarConfig } from '@/contexts/GameContext';
import { AvatarDisplay } from '@/components/feature/AvatarDisplay';
import { AVATAR_OPTIONS } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const SKIN_COLORS: Record<string, string> = {
  tone1: '#FDDBB4', tone2: '#F0C27F', tone3: '#C68642',
  tone4: '#8D5524', tone5: '#5C3317', tone6: '#3B1F0B',
};

export default function AvatarCreation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAvatar } = useGame();
  const { user } = useAuth();

  const [config, setConfig] = useState<AvatarConfig>({
    genderPresentation: 'neutral',
    skinTone: 'tone2',
    hairstyle: 'short',
    clothingStyle: 'casual',
    bodyType: 'average',
    name: user?.displayName || 'My Character',
  });

  const update = (key: keyof AvatarConfig, value: string) => setConfig((p) => ({ ...p, [key]: value }));

  const handleNext = () => {
    setAvatar(config);
    router.push('/onboarding/categories');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.stepDots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>2 / 4</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.avatarPreview}>
          <AvatarDisplay avatar={config} level={1} size="xl" />
          <TextInput
            style={styles.nameInput}
            value={config.name}
            onChangeText={(v) => update('name', v)}
            placeholder="Character Name"
            placeholderTextColor={Colors.textMuted}
            maxLength={24}
          />
        </View>

        <Section title="Gender Presentation">
          <OptionRow
            options={AVATAR_OPTIONS.genderPresentation}
            selected={config.genderPresentation}
            onSelect={(v) => update('genderPresentation', v)}
          />
        </Section>

        <Section title="Skin Tone">
          <View style={styles.skinRow}>
            {AVATAR_OPTIONS.skinTones.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.skinBtn, { backgroundColor: SKIN_COLORS[t.id] }, config.skinTone === t.id && styles.skinActive]}
                onPress={() => update('skinTone', t.id)}
              />
            ))}
          </View>
        </Section>

        <Section title="Hairstyle">
          <OptionRow
            options={AVATAR_OPTIONS.hairstyles}
            selected={config.hairstyle}
            onSelect={(v) => update('hairstyle', v)}
          />
        </Section>

        <Section title="Clothing Style">
          <OptionRow
            options={AVATAR_OPTIONS.clothingStyles}
            selected={config.clothingStyle}
            onSelect={(v) => update('clothingStyle', v)}
          />
        </Section>

        <Section title="Body Type">
          <OptionRow
            options={AVATAR_OPTIONS.bodyTypes}
            selected={config.bodyType}
            onSelect={(v) => update('bodyType', v)}
          />
        </Section>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
          onPress={handleNext}
        >
          <Text style={styles.btnText}>Choose Categories</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function OptionRow({
  options, selected, onSelect,
}: {
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          style={[styles.optionChip, selected === o.id && styles.optionChipActive]}
          onPress={() => onSelect(o.id)}
        >
          <Text style={[styles.optionText, selected === o.id && styles.optionTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, paddingBottom: Spacing.md,
  },
  stepDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceBorder },
  dotActive: { backgroundColor: Colors.gold, width: 18 },
  stepLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },
  avatarPreview: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  nameInput: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.surfaceBorder, height: 48, paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary,
    textAlign: 'center', minWidth: 200,
  },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  skinRow: { flexDirection: 'row', gap: 12 },
  skinBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  skinActive: { borderColor: Colors.gold, transform: [{ scale: 1.15 }] },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.round,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  optionChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  optionText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  optionTextActive: { color: Colors.textInverse },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  btn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
