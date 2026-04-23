import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

export default function EmptyState({ emoji = '📭', title, desc, action, onAction }) {
  const { C } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      {desc && <Text style={[styles.desc, { color: C.muted }]}>{desc}</Text>}
      {action && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.accent }]} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emoji: { fontSize: 52, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
