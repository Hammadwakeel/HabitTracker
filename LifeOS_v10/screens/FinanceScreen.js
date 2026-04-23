import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FinanceScreen() {
  const { C } = useTheme();
  const [tab, setTab] = useState('networth');
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [savings, setSavings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [subs, setSubs] = useState([]);
  const [newAsset, setNewAsset] = useState({ name: '', amount: '' });
  const [newLiability, setNewLiability] = useState({ name: '', amount: '' });
  const [newSaving, setNewSaving] = useState({ name: '', goal: '', saved: '' });
  const [newInvoice, setNewInvoice] = useState({ client: '', amount: '', status: 'sent', desc: '' });
  const [newSub, setNewSub] = useState({ name: '', amount: '', cycle: 'monthly' });

  useFocusEffect(useCallback(() => {
    (async () => {
      const a = await AsyncStorage.getItem('assets'); if (a) setAssets(JSON.parse(a));
      const l = await AsyncStorage.getItem('liabilities'); if (l) setLiabilities(JSON.parse(l));
      const sv = await AsyncStorage.getItem('savings'); if (sv) setSavings(JSON.parse(sv));
      const inv = await AsyncStorage.getItem('invoices'); if (inv) setInvoices(JSON.parse(inv));
      const sub = await AsyncStorage.getItem('subscriptions'); if (sub) setSubs(JSON.parse(sub));
    })();
  }, []));

  const save = async (key, val) => AsyncStorage.setItem(key, JSON.stringify(val));

  const totalAssets = assets.reduce((s, a) => s + parseFloat(a.amount || 0), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + parseFloat(l.amount || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const totalSubs = subs.reduce((s, sub) => s + (sub.cycle === 'monthly' ? parseFloat(sub.amount || 0) : parseFloat(sub.amount || 0) / 12), 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);

  const addItem = async (list, setList, item, key, reset) => {
    const updated = [...list, { ...item, id: Date.now() }];
    setList(updated); await save(key, updated); reset();
  };

  const deleteItem = async (list, setList, id, key) => {
    const updated = list.filter(i => i.id !== id);
    setList(updated); await save(key, updated);
  };

  const STATUS_COLORS = { sent: C.yellow, paid: C.green, overdue: C.red };

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>💰 Finance</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['networth','📊 Net Worth'],['savings','🎯 Savings'],['invoices','🧾 Invoices'],['subs','📱 Subscriptions']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* NET WORTH */}
        {tab === 'networth' && (
          <>
            <View style={[s.nwCard, { backgroundColor: netWorth >= 0 ? C.greenSoft : C.redSoft, borderColor: netWorth >= 0 ? C.green + '44' : C.red + '44' }]}>
              <Text style={[s.nwLabel, { color: C.muted }]}>NET WORTH</Text>
              <Text style={[s.nwNum, { color: netWorth >= 0 ? C.green : C.red }]}>₨{netWorth.toLocaleString()}</Text>
              <View style={s.nwRow}>
                <Text style={[s.nwSub, { color: C.green }]}>Assets: ₨{totalAssets.toLocaleString()}</Text>
                <Text style={[s.nwSub, { color: C.red }]}>Debts: ₨{totalLiabilities.toLocaleString()}</Text>
              </View>
            </View>

            {[
              { title: '✅ Assets', list: assets, setList: setAssets, item: newAsset, setItem: setNewAsset, key: 'assets', color: C.green },
              { title: '❌ Liabilities / Debts', list: liabilities, setList: setLiabilities, item: newLiability, setItem: setNewLiability, key: 'liabilities', color: C.red },
            ].map(({ title, list, setList, item, setItem, key, color }) => (
              <View key={key} style={s.card}>
                <Text style={s.cardTitle}>{title}</Text>
                <View style={s.inputRow}>
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Name (e.g. Laptop)" placeholderTextColor={C.muted} value={item.name} onChangeText={v => setItem(p => ({ ...p, name: v }))} />
                  <TextInput style={[s.input, { flex: 0.5 }]} placeholder="₨" placeholderTextColor={C.muted} keyboardType="numeric" value={item.amount} onChangeText={v => setItem(p => ({ ...p, amount: v }))} />
                  <TouchableOpacity style={[s.addBtn, { backgroundColor: color }]} onPress={() => addItem(list, setList, item, key, () => setItem({ name: '', amount: '' }))}>
                    <Text style={s.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {list.map(entry => (
                  <View key={entry.id} style={s.entryRow}>
                    <Text style={[s.entryName, { color: C.text }]}>{entry.name}</Text>
                    <Text style={[s.entryAmt, { color }]}>₨{parseFloat(entry.amount).toLocaleString()}</Text>
                    <TouchableOpacity onPress={() => deleteItem(list, setList, entry.id, key)}><Text style={{ color: C.red, marginLeft: 8 }}>✕</Text></TouchableOpacity>
                  </View>
                ))}
                {list.length === 0 && <Text style={[s.empty, { color: C.muted }]}>None added yet.</Text>}
              </View>
            ))}
          </>
        )}

        {/* SAVINGS GOALS */}
        {tab === 'savings' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Add Savings Goal</Text>
              <TextInput style={s.input} placeholder="Goal name (e.g. New Laptop)" placeholderTextColor={C.muted} value={newSaving.name} onChangeText={v => setNewSaving(p => ({ ...p, name: v }))} />
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Target ₨" placeholderTextColor={C.muted} keyboardType="numeric" value={newSaving.goal} onChangeText={v => setNewSaving(p => ({ ...p, goal: v }))} />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Saved so far ₨" placeholderTextColor={C.muted} keyboardType="numeric" value={newSaving.saved} onChangeText={v => setNewSaving(p => ({ ...p, saved: v }))} />
              </View>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={() => addItem(savings, setSavings, newSaving, 'savings', () => setNewSaving({ name: '', goal: '', saved: '' }))}>
                <Text style={s.saveBtnText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
            {savings.map(goal => {
              const pct = Math.min((parseFloat(goal.saved) / parseFloat(goal.goal)) * 100, 100);
              const done = pct >= 100;
              return (
                <View key={goal.id} style={s.savingCard}>
                  <View style={s.row}>
                    <Text style={[s.savingName, { color: C.text }]}>{done ? '✅ ' : '🎯 '}{goal.name}</Text>
                    <TouchableOpacity onPress={() => deleteItem(savings, setSavings, goal.id, 'savings')}><Text style={{ color: C.red }}>✕</Text></TouchableOpacity>
                  </View>
                  <View style={s.row}>
                    <Text style={[s.savingAmt, { color: C.green }]}>₨{parseFloat(goal.saved || 0).toLocaleString()}</Text>
                    <Text style={[s.savingGoal, { color: C.muted }]}>of ₨{parseFloat(goal.goal || 0).toLocaleString()}</Text>
                    <Text style={[s.savingPct, { color: done ? C.green : C.accent }]}>{pct.toFixed(0)}%</Text>
                  </View>
                  <View style={s.barBg}><View style={[s.barFill, { width: `${pct}%`, backgroundColor: done ? C.green : C.accent }]} /></View>
                </View>
              );
            })}
            {savings.length === 0 && <Text style={[s.empty, { color: C.muted, textAlign: 'center', marginTop: 30 }]}>No savings goals yet.</Text>}
          </>
        )}

        {/* INVOICES */}
        {tab === 'invoices' && (
          <>
            <View style={s.statsRow}>
              <View style={[s.statCard, { borderColor: C.green + '44' }]}><Text style={s.statLabel}>Paid</Text><Text style={[s.statNum, { color: C.green }]}>₨{paidInvoices.toLocaleString()}</Text></View>
              <View style={[s.statCard, { borderColor: C.yellow + '44' }]}><Text style={s.statLabel}>Pending</Text><Text style={[s.statNum, { color: C.yellow }]}>₨{pendingInvoices.toLocaleString()}</Text></View>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>Add Invoice</Text>
              <TextInput style={s.input} placeholder="Client name" placeholderTextColor={C.muted} value={newInvoice.client} onChangeText={v => setNewInvoice(p => ({ ...p, client: v }))} />
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Amount ₨" placeholderTextColor={C.muted} keyboardType="numeric" value={newInvoice.amount} onChangeText={v => setNewInvoice(p => ({ ...p, amount: v }))} />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Description" placeholderTextColor={C.muted} value={newInvoice.desc} onChangeText={v => setNewInvoice(p => ({ ...p, desc: v }))} />
              </View>
              <View style={s.statusRow}>
                {['sent','paid','overdue'].map(st => (
                  <TouchableOpacity key={st} style={[s.statusBtn, newInvoice.status === st && { backgroundColor: STATUS_COLORS[st] + '22', borderColor: STATUS_COLORS[st] }]} onPress={() => setNewInvoice(p => ({ ...p, status: st }))}>
                    <Text style={[s.statusBtnText, { color: newInvoice.status === st ? STATUS_COLORS[st] : C.muted }]}>{st.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={() => addItem(invoices, setInvoices, { ...newInvoice, date: new Date().toISOString() }, 'invoices', () => setNewInvoice({ client: '', amount: '', status: 'sent', desc: '' }))}>
                <Text style={s.saveBtnText}>Add Invoice</Text>
              </TouchableOpacity>
            </View>
            {invoices.map(inv => (
              <View key={inv.id} style={s.invoiceCard}>
                <View style={s.row}>
                  <Text style={[s.invoiceClient, { color: C.text }]}>{inv.client}</Text>
                  <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[inv.status] + '22' }]}>
                    <Text style={[s.statusBadgeText, { color: STATUS_COLORS[inv.status] }]}>{inv.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[s.invoiceAmt, { color: C.green }]}>₨{parseFloat(inv.amount).toLocaleString()}</Text>
                {inv.desc ? <Text style={[s.invoiceDesc, { color: C.muted }]}>{inv.desc}</Text> : null}
                <View style={s.invoiceActions}>
                  {inv.status !== 'paid' && (
                    <TouchableOpacity style={[s.markPaidBtn, { backgroundColor: C.greenSoft }]} onPress={async () => {
                      const updated = invoices.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i);
                      setInvoices(updated); await save('invoices', updated);
                    }}>
                      <Text style={[s.markPaidText, { color: C.green }]}>Mark Paid</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => deleteItem(invoices, setInvoices, inv.id, 'invoices')}><Text style={{ color: C.red }}>Delete</Text></TouchableOpacity>
                </View>
              </View>
            ))}
            {invoices.length === 0 && <Text style={[s.empty, { color: C.muted, textAlign: 'center', marginTop: 30 }]}>No invoices yet.</Text>}
          </>
        )}

        {/* SUBSCRIPTIONS */}
        {tab === 'subs' && (
          <>
            <View style={[s.subsTotal, { backgroundColor: C.accentSoft }]}>
              <Text style={[s.subsTotalLabel, { color: C.muted }]}>Monthly subscription spend</Text>
              <Text style={[s.subsTotalNum, { color: C.accent }]}>₨{totalSubs.toFixed(0).toLocaleString()}/mo</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>Add Subscription</Text>
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Service name" placeholderTextColor={C.muted} value={newSub.name} onChangeText={v => setNewSub(p => ({ ...p, name: v }))} />
                <TextInput style={[s.input, { flex: 0.5 }]} placeholder="₨" placeholderTextColor={C.muted} keyboardType="numeric" value={newSub.amount} onChangeText={v => setNewSub(p => ({ ...p, amount: v }))} />
              </View>
              <View style={s.inputRow}>
                {['monthly','yearly'].map(c => (
                  <TouchableOpacity key={c} style={[s.cycleBtn, newSub.cycle === c && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setNewSub(p => ({ ...p, cycle: c }))}>
                    <Text style={[s.cycleBtnText, { color: newSub.cycle === c ? C.accent : C.muted }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[s.addBtn, { backgroundColor: C.accent, flex: 1 }]} onPress={() => addItem(subs, setSubs, newSub, 'subscriptions', () => setNewSub({ name: '', amount: '', cycle: 'monthly' }))}>
                  <Text style={s.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            {subs.map(sub => (
              <View key={sub.id} style={s.subRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.subName, { color: C.text }]}>{sub.name}</Text>
                  <Text style={[s.subCycle, { color: C.muted }]}>{sub.cycle}</Text>
                </View>
                <Text style={[s.subAmt, { color: C.orange }]}>₨{parseFloat(sub.amount).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => deleteItem(subs, setSubs, sub.id, 'subscriptions')}><Text style={{ color: C.red, marginLeft: 10 }}>✕</Text></TouchableOpacity>
              </View>
            ))}
            {subs.length === 0 && <Text style={[s.empty, { color: C.muted, textAlign: 'center', marginTop: 20 }]}>No subscriptions added.</Text>}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 16 },
  tabScroll: { marginBottom: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabText: { fontWeight: '600', fontSize: 13 },
  nwCard: { borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, alignItems: 'center' },
  nwLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  nwNum: { fontSize: 40, fontWeight: '800', marginBottom: 8 },
  nwRow: { flexDirection: 'row', gap: 20 },
  nwSub: { fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { backgroundColor: C.surface, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  entryName: { flex: 1, fontSize: 14, fontWeight: '600' },
  entryAmt: { fontSize: 15, fontWeight: '800' },
  empty: { fontSize: 14, paddingVertical: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },
  statLabel: { color: C.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statNum: { fontSize: 18, fontWeight: '800' },
  savingCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  savingName: { fontSize: 15, fontWeight: '700' },
  savingAmt: { fontSize: 16, fontWeight: '800' },
  savingGoal: { fontSize: 14 },
  savingPct: { fontSize: 16, fontWeight: '800' },
  barBg: { height: 6, backgroundColor: C.border, borderRadius: 99, marginTop: 8 },
  barFill: { height: 6, borderRadius: 99 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  statusBtnText: { fontWeight: '700', fontSize: 12 },
  invoiceCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  invoiceClient: { fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  invoiceAmt: { fontSize: 20, fontWeight: '800', marginVertical: 4 },
  invoiceDesc: { fontSize: 13 },
  invoiceActions: { flexDirection: 'row', gap: 12, marginTop: 10, alignItems: 'center' },
  markPaidBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  markPaidText: { fontWeight: '700', fontSize: 13 },
  subsTotal: { borderRadius: 16, padding: 16, marginBottom: 14, alignItems: 'center' },
  subsTotalLabel: { fontSize: 13, marginBottom: 4 },
  subsTotalNum: { fontSize: 28, fontWeight: '800' },
  subRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  subName: { fontSize: 14, fontWeight: '700' },
  subCycle: { fontSize: 12, marginTop: 2 },
  subAmt: { fontSize: 16, fontWeight: '800' },
  cycleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  cycleBtnText: { fontWeight: '600', fontSize: 13 },
});
