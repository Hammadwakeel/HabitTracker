import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { BOOKS } from '../data/content';
import { getBookProgress, saveBookProgress } from '../utils/storage';

export default function BooksScreen() {
  const { C } = useTheme();
  const [selected, setSelected] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [progress, setProgress] = useState({});

  useFocusEffect(useCallback(() => {
    (async () => {
      const p = {};
      for (const b of BOOKS) p[b.id] = await getBookProgress(b.id);
      setProgress(p);
    })();
  }, []));

  const markRead = async (bookId, idx) => {
    const prev = progress[bookId] || { readChapters: [] };
    const already = prev.readChapters.includes(idx);
    const updated = { readChapters: already ? prev.readChapters.filter(i => i !== idx) : [...prev.readChapters, idx] };
    await saveBookProgress(bookId, updated);
    setProgress(p => ({ ...p, [bookId]: updated }));
  };

  const book = selected ? BOOKS.find(b => b.id === selected) : null;
  const s = makeStyles(C);

  if (chapter !== null && book) {
    const ch = book.chapters[chapter];
    const isRead = progress[selected]?.readChapters?.includes(chapter);
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.container}>
          <TouchableOpacity onPress={() => setChapter(null)}><Text style={[s.back, { color: C.accent }]}>← Back</Text></TouchableOpacity>
          <Text style={[s.chNum, { color: C.muted }]}>Chapter {chapter + 1} of {book.chapters.length}</Text>
          <Text style={[s.chTitle, { color: C.text }]}>{ch.title}</Text>
          <View style={[s.divider, { backgroundColor: book.color }]} />
          <Text style={[s.chContent, { color: C.text }]}>{ch.content}</Text>
          <TouchableOpacity style={[s.markBtn, { backgroundColor: isRead ? C.green : book.color }]} onPress={() => markRead(selected, chapter)}>
            <Text style={s.markBtnText}>{isRead ? '✓ Marked as Read' : 'Mark as Read'}</Text>
          </TouchableOpacity>
          <View style={s.navRow}>
            {chapter > 0 && <TouchableOpacity style={[s.navBtn, { borderColor: C.border }]} onPress={() => setChapter(chapter - 1)}><Text style={[s.navText, { color: C.accent }]}>← Prev</Text></TouchableOpacity>}
            {chapter < book.chapters.length - 1 && <TouchableOpacity style={[s.navBtn, { borderColor: C.border, marginLeft: 'auto' }]} onPress={() => setChapter(chapter + 1)}><Text style={[s.navText, { color: C.accent }]}>Next →</Text></TouchableOpacity>}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (book) {
    const prog = progress[book.id] || { readChapters: [] };
    const pct = Math.round((prog.readChapters.length / book.chapters.length) * 100);
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.container}>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={[s.back, { color: C.accent }]}>← All Books</Text></TouchableOpacity>
          <View style={[s.hero, { backgroundColor: book.colorSoft, borderColor: book.color + '44' }]}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>{book.emoji}</Text>
            <Text style={[s.heroTitle, { color: C.text }]}>{book.title}</Text>
            <Text style={[s.heroAuthor, { color: C.muted }]}>by {book.author}</Text>
          </View>
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={s.cardTitle}>Progress</Text>
              <Text style={[{ fontSize: 18, fontWeight: '800', color: book.color }]}>{pct}%</Text>
            </View>
            <View style={s.barBg}><View style={[s.barFill, { width: `${pct}%`, backgroundColor: book.color }]} /></View>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Chapters</Text>
            {book.chapters.map((ch, i) => {
              const read = prog.readChapters.includes(i);
              return (
                <TouchableOpacity key={i} style={s.chRow} onPress={() => setChapter(i)}>
                  <View style={[s.chCheck, read && { backgroundColor: book.color, borderColor: book.color }]}>
                    {read && <Text style={s.checkMark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.chRowNum, { color: C.muted }]}>Chapter {i + 1}</Text>
                    <Text style={[s.chRowTitle, { color: C.text }]}>{ch.title}</Text>
                  </View>
                  <Text style={[s.arrow, { color: C.muted }]}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.heading}>📚 Book Summaries</Text>
        <Text style={[s.sub, { color: C.muted }]}>Key lessons from the best books</Text>
        {BOOKS.map(b => {
          const prog = progress[b.id] || { readChapters: [] };
          const pct = Math.round((prog.readChapters.length / b.chapters.length) * 100);
          return (
            <TouchableOpacity key={b.id} style={s.bookCard} onPress={() => setSelected(b.id)} activeOpacity={0.8}>
              <View style={[s.bookIcon, { backgroundColor: b.colorSoft }]}><Text style={{ fontSize: 26 }}>{b.emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bookTitle, { color: C.text }]}>{b.title}</Text>
                <Text style={[s.bookAuthor, { color: C.muted }]}>{b.author} · {b.readTime}</Text>
                <Text style={[s.bookTag, { color: C.muted }]}>{b.tagline}</Text>
                {pct > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <View style={[s.barBg, { flex: 1 }]}><View style={[s.barFill, { width: `${pct}%`, backgroundColor: b.color }]} /></View>
                    <Text style={[{ fontSize: 11, fontWeight: '700', color: b.color }]}>{pct}%</Text>
                  </View>
                )}
              </View>
              <Text style={[s.arrow, { color: C.muted }]}>›</Text>
            </TouchableOpacity>
          );
        })}
        <View style={[s.disclaimer, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[{ fontSize: 12, color: C.muted }]}>📝 Original summaries and key lessons — not reproductions of the books.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10 },
  sub: { fontSize: 14, marginBottom: 20, marginTop: 4 },
  back: { fontSize: 15, fontWeight: '600', marginBottom: 16 },
  hero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1 },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroAuthor: { fontSize: 14, marginTop: 4 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 10 },
  barBg: { height: 6, backgroundColor: C.border, borderRadius: 99 },
  barFill: { height: 6, borderRadius: 99 },
  chRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  chCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chRowNum: { fontSize: 11, fontWeight: '700' },
  chRowTitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  arrow: { fontSize: 20 },
  chNum: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  chTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  divider: { height: 3, width: 40, borderRadius: 99, marginBottom: 20 },
  chContent: { fontSize: 15, lineHeight: 26, marginBottom: 24 },
  markBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  markBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, backgroundColor: C.card },
  navText: { fontWeight: '600', fontSize: 14 },
  bookCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 14 },
  bookIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 16, fontWeight: '700' },
  bookAuthor: { fontSize: 12, marginTop: 2 },
  bookTag: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  disclaimer: { borderRadius: 12, padding: 12, marginTop: 4, borderWidth: 1 },
});
