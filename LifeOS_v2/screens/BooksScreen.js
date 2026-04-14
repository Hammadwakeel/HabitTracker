import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { BOOKS } from '../data/books';
import { getBookProgress, saveBookProgress } from '../utils/storage';

export default function BooksScreen() {
  const [selected, setSelected] = useState(null); // bookId
  const [chapter, setChapter] = useState(null); // chapter index
  const [progress, setProgress] = useState({}); // { bookId: { readChapters: [] } }

  useFocusEffect(useCallback(() => {
    (async () => {
      const p = {};
      for (const b of BOOKS) {
        p[b.id] = await getBookProgress(b.id);
      }
      setProgress(p);
    })();
  }, []));

  const markRead = async (bookId, chapterIndex) => {
    const prev = progress[bookId] || { readChapters: [] };
    const already = prev.readChapters.includes(chapterIndex);
    const updated = {
      readChapters: already
        ? prev.readChapters.filter(i => i !== chapterIndex)
        : [...prev.readChapters, chapterIndex],
    };
    await saveBookProgress(bookId, updated);
    setProgress(p => ({ ...p, [bookId]: updated }));
  };

  const getBook = (id) => BOOKS.find(b => b.id === id);

  // Reading a chapter
  if (chapter !== null && selected) {
    const book = getBook(selected);
    const ch = book.chapters[chapter];
    const isRead = progress[selected]?.readChapters?.includes(chapter);
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.backBtn} onPress={() => setChapter(null)}>
            <Text style={s.backText}>← Back to {book.title}</Text>
          </TouchableOpacity>
          <Text style={s.chapterNum}>Chapter {chapter + 1} of {book.chapters.length}</Text>
          <Text style={s.chapterTitle}>{ch.title}</Text>
          <View style={[s.chapterDivider, { backgroundColor: book.color }]} />
          <Text style={s.chapterContent}>{ch.content}</Text>
          <TouchableOpacity style={[s.markBtn, { backgroundColor: isRead ? COLORS.green : book.color }]} onPress={() => markRead(selected, chapter)} activeOpacity={0.8}>
            <Text style={s.markBtnText}>{isRead ? '✓ Marked as Read' : 'Mark as Read'}</Text>
          </TouchableOpacity>
          <View style={s.chapterNav}>
            {chapter > 0 && (
              <TouchableOpacity style={s.navBtn} onPress={() => setChapter(chapter - 1)}>
                <Text style={s.navText}>← Previous</Text>
              </TouchableOpacity>
            )}
            {chapter < book.chapters.length - 1 && (
              <TouchableOpacity style={[s.navBtn, s.navBtnRight]} onPress={() => setChapter(chapter + 1)}>
                <Text style={s.navText}>Next →</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Book detail
  if (selected) {
    const book = getBook(selected);
    const prog = progress[selected] || { readChapters: [] };
    const pct = Math.round((prog.readChapters.length / book.chapters.length) * 100);
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.backBtn} onPress={() => setSelected(null)}>
            <Text style={s.backText}>← All Books</Text>
          </TouchableOpacity>
          <View style={[s.bookHero, { backgroundColor: book.colorSoft, borderColor: book.color + '44' }]}>
            <Text style={s.bookHeroEmoji}>{book.emoji}</Text>
            <Text style={s.bookHeroTitle}>{book.title}</Text>
            <Text style={s.bookHeroAuthor}>by {book.author}</Text>
            <Text style={s.bookHeroTagline}>{book.tagline}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>About this summary</Text>
            <Text style={s.bookDesc}>{book.description}</Text>
            <View style={s.metaRow}>
              <Text style={s.metaChip}>📚 {book.chapters.length} chapters</Text>
              <Text style={s.metaChip}>⏱ {book.readTime}</Text>
            </View>
          </View>
          {/* Progress */}
          <View style={s.card}>
            <View style={s.progressRow}>
              <Text style={s.cardTitle}>Your Progress</Text>
              <Text style={[s.pctText, { color: book.color }]}>{pct}%</Text>
            </View>
            <View style={s.barBg}><View style={[s.barFill, { width: `${pct}%`, backgroundColor: book.color }]} /></View>
            <Text style={s.progSub}>{prog.readChapters.length} of {book.chapters.length} chapters read</Text>
          </View>
          {/* Chapters */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Chapters</Text>
            {book.chapters.map((ch, i) => {
              const read = prog.readChapters.includes(i);
              return (
                <TouchableOpacity key={i} style={s.chapterRow} onPress={() => setChapter(i)} activeOpacity={0.7}>
                  <View style={[s.chapterCheck, read && { backgroundColor: book.color, borderColor: book.color }]}>
                    {read && <Text style={s.chapterCheckMark}>✓</Text>}
                  </View>
                  <View style={s.chapterInfo}>
                    <Text style={s.chapterRowNum}>Chapter {i + 1}</Text>
                    <Text style={s.chapterRowTitle}>{ch.title}</Text>
                  </View>
                  <Text style={s.chapterArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Book list
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Book Summaries</Text>
        <Text style={s.sub}>Key lessons from the best self-improvement books</Text>
        {BOOKS.map(book => {
          const prog = progress[book.id] || { readChapters: [] };
          const pct = Math.round((prog.readChapters.length / book.chapters.length) * 100);
          return (
            <TouchableOpacity key={book.id} style={s.bookCard} onPress={() => setSelected(book.id)} activeOpacity={0.8}>
              <View style={s.bookCardLeft}>
                <View style={[s.bookIcon, { backgroundColor: book.colorSoft }]}>
                  <Text style={s.bookIconEmoji}>{book.emoji}</Text>
                </View>
                <View style={s.bookCardInfo}>
                  <Text style={s.bookCardTitle}>{book.title}</Text>
                  <Text style={s.bookCardAuthor}>{book.author}</Text>
                  <Text style={s.bookCardTagline}>{book.tagline}</Text>
                  {pct > 0 && (
                    <View style={s.miniProgress}>
                      <View style={s.miniBarBg}>
                        <View style={[s.miniBarFill, { width: `${pct}%`, backgroundColor: book.color }]} />
                      </View>
                      <Text style={[s.miniPct, { color: book.color }]}>{pct}%</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={s.bookArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>📝 These are original summaries and key lessons, not reproductions of the books.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginTop: 10 },
  sub: { fontSize: 14, color: COLORS.muted, marginBottom: 20, marginTop: 4 },
  backBtn: { marginBottom: 16 },
  backText: { color: COLORS.accent, fontWeight: '600', fontSize: 15 },
  bookCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center' },
  bookCardLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bookIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bookIconEmoji: { fontSize: 26 },
  bookCardInfo: { flex: 1 },
  bookCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  bookCardAuthor: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  bookCardTagline: { fontSize: 12, color: COLORS.muted, marginTop: 4, fontStyle: 'italic' },
  miniProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  miniBarBg: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 99 },
  miniBarFill: { height: 4, borderRadius: 99 },
  miniPct: { fontSize: 11, fontWeight: '700' },
  bookArrow: { color: COLORS.muted, fontSize: 20, marginLeft: 8 },
  bookHero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1 },
  bookHeroEmoji: { fontSize: 48, marginBottom: 10 },
  bookHeroTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  bookHeroAuthor: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  bookHeroTagline: { fontSize: 13, color: COLORS.muted, marginTop: 6, fontStyle: 'italic', textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  bookDesc: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaChip: { color: COLORS.muted, fontSize: 12, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: COLORS.border },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pctText: { fontSize: 18, fontWeight: '800' },
  barBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 99 },
  barFill: { height: 6, borderRadius: 99 },
  progSub: { color: COLORS.muted, fontSize: 12, marginTop: 8 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chapterCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  chapterCheckMark: { color: '#000', fontWeight: '800', fontSize: 13 },
  chapterInfo: { flex: 1 },
  chapterRowNum: { fontSize: 11, color: COLORS.muted, fontWeight: '700' },
  chapterRowTitle: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginTop: 2 },
  chapterArrow: { color: COLORS.muted, fontSize: 20 },
  chapterNum: { fontSize: 12, color: COLORS.muted, fontWeight: '700', marginBottom: 8 },
  chapterTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  chapterDivider: { height: 3, width: 40, borderRadius: 99, marginBottom: 20 },
  chapterContent: { color: COLORS.text, fontSize: 15, lineHeight: 26, marginBottom: 24 },
  markBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  markBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chapterNav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  navBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  navBtnRight: { marginLeft: 'auto' },
  navText: { color: COLORS.accent, fontWeight: '600', fontSize: 14 },
  disclaimer: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginTop: 4, borderWidth: 1, borderColor: COLORS.border },
  disclaimerText: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
});
