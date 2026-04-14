import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENSE_CATS = ['🍔 Food','🚗 Transport','📱 Phone','💡 Utilities','🛍 Shopping','💊 Health','📚 Learning','🎮 Fun','💰 Other'];
const BILL_ICONS = { internet: '🌐', phone: '📱', electricity: '💡', rent: '🏠', netflix: '📺', spotify: '🎵', other: '📋' };

export default function DailyLifeScreen() {
  const { C } = useTheme();
  const [tab, setTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [grocery, setGrocery] = useState([]);
  const [bills, setBills] = useState([]);
  const [newExpense, setNewExpense] = useState({ amount: '', note: '', cat: '🍔 Food' });
  const [newItem, setNewItem] = useState('');
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDay: '', type: 'other' });
  const [weather, setWeather] = useState(null);
  const [budget, setBudget] = useState('');

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    const e = await AsyncStorage.getItem('expenses'); if (e) setExpenses(JSON.parse(e));
    const g = await AsyncStorage.getItem('grocery'); if (g) setGrocery(JSON.parse(g));
    const b = await AsyncStorage.getItem('bills'); if (b) setBills(JSON.parse(b));
    const bud = await AsyncStorage.getItem('budget'); if (bud) setBudget(bud);
  };

  const save = async (key, val) => { await AsyncStorage.setItem(key, JSON.stringify(val)); };

  const addExpense = async () => {
    if (!newExpense.amount) return;
    const item = { ...newExpense, date: new Date().toISOString(), id: Date.now() };
    const updated = [item, ...expenses];
    setExpenses(updated); await save('expenses', updated);
    setNewExpense({ amount: '', note: '', cat: '🍔 Food' });
  };

  const deleteExpense = async (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated); await save('expenses', updated);
  };

  const addGrocery = async () => {
    if (!newItem.trim()) return;
    const updated = [...grocery, { id: Date.now(), text: newItem.trim(), done: false }];
    setGrocery(updated); await save('grocery', updated); setNewItem('');
  };

  const toggleGrocery = async (id) => {
    const updated = grocery.map(g => g.id === id ? { ...g, done: !g.done } : g);
    setGrocery(updated); await save('grocery', updated);
  };

  const addBill = async () => {
    if (!newBill.name || !newBill.amount) return;
    const updated = [...bills, { ...newBill, id: Date.now() }];
    setBills(updated); await save('bills', updated);
    setNewBill({ name: '', amount: '', dueDay: '', type: 'other' });
  };

  const toggleBillPaid = async (id) => {
    const updated = bills.map(b => b.id === id ? { ...b, paid: !b.paid } : b);
    setBills(updated); await save('bills', updated);
  };

  const todayExpenses = expenses.filter(e => e.date?.startsWith(new Date().toISOString().split('T')[0]));
  const monthExpenses = expenses.filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7)));
  const todayTotal = todayExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const monthTotal = monthExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const budgetNum = parseFloat(budget) || 0;
  const budgetUsed = budgetNum > 0 ? Math.min((monthTotal / budgetNum) * 100, 100) : 0;
  const dueThisWeek = bills.filter(b => !b.paid && parseInt(b.dueDay) >= new Date().getDate() && parseInt(b.dueDay) <= new Date().getDate() + 7);

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>📱 Daily Life</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          {[['expenses','💸 Expenses'],['grocery','🛒 Grocery'],['bills','📋 Bills']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { backgroundColor: C.accent }]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, { color: tab === t ? '#fff' : C.muted }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* EXPENSES */}
        {tab === 'expenses' && (
          <>
            <View style={s.statsRow}>
              <View style={[s.statCard, { borderColor: C.orange + '44' }]}>
                <Text style={s.statLabel}>Today</Text>
                <Text style={[s.statNum, { color: C.orange }]}>₨{todayTotal.toLocaleString()}</Text>
              </View>
              <View style={[s.statCard, { borderColor: C.accent + '44' }]}>
                <Text style={s.statLabel}>This Month</Text>
                <Text style={[s.statNum, { color: C.accent }]}>₨{monthTotal.toLocaleString()}</Text>
              </View>
            </View>

            {budgetNum > 0 && (
              <View style={s.card}>
                <View style={s.row}>
                  <Text style={s.cardTitle}>Monthly Budget</Text>
                  <Text style={[s.bigNum, { color: budgetUsed > 90 ? C.red : C.green }]}>₨{budgetNum.toLocaleString()}</Text>
                </View>
                <View style={s.barBg}><View style={[s.barFill, { width: `${budgetUsed}%`, backgroundColor: budgetUsed > 90 ? C.red : budgetUsed > 70 ? C.yellow : C.green }]} /></View>
                <Text style={[s.hint, { color: C.muted, marginTop: 6 }]}>{budgetUsed.toFixed(0)}% used — ₨{Math.max(0, budgetNum - monthTotal).toLocaleString()} remaining</Text>
              </View>
            )}

            <View style={s.card}>
              <Text style={s.cardTitle}>Add Expense</Text>
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 0.4 }]} placeholder="Amount ₨" placeholderTextColor={C.muted} keyboardType="numeric" value={newExpense.amount} onChangeText={v => setNewExpense(p => ({ ...p, amount: v }))} />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Note (optional)" placeholderTextColor={C.muted} value={newExpense.note} onChangeText={v => setNewExpense(p => ({ ...p, note: v }))} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {EXPENSE_CATS.map(cat => (
                  <TouchableOpacity key={cat} style={[s.catBtn, newExpense.cat === cat && { backgroundColor: C.accentSoft, borderColor: C.accent }]} onPress={() => setNewExpense(p => ({ ...p, cat }))}>
                    <Text style={[s.catText, { color: newExpense.cat === cat ? C.accent : C.muted }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Monthly budget ₨" placeholderTextColor={C.muted} keyboardType="numeric" value={budget} onChangeText={v => { setBudget(v); AsyncStorage.setItem('budget', v); }} />
                <TouchableOpacity style={[s.addBtn, { backgroundColor: C.accent }]} onPress={addExpense}><Text style={s.addBtnText}>Add</Text></TouchableOpacity>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Recent Expenses</Text>
              {expenses.slice(0, 20).map(e => (
                <View key={e.id} style={s.expenseRow}>
                  <Text style={s.expenseCat}>{e.cat?.split(' ')[0]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.expenseNote, { color: C.text }]}>{e.note || e.cat}</Text>
                    <Text style={[s.expenseDate, { color: C.muted }]}>{new Date(e.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[s.expenseAmt, { color: C.orange }]}>₨{parseFloat(e.amount).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => deleteExpense(e.id)}><Text style={{ color: C.red, marginLeft: 8, fontSize: 16 }}>✕</Text></TouchableOpacity>
                </View>
              ))}
              {expenses.length === 0 && <Text style={[s.empty, { color: C.muted }]}>No expenses logged yet.</Text>}
            </View>
          </>
        )}

        {/* GROCERY */}
        {tab === 'grocery' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>🛒 Grocery List</Text>
            <View style={s.inputRow}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Add item..." placeholderTextColor={C.muted} value={newItem} onChangeText={setNewItem} onSubmitEditing={addGrocery} />
              <TouchableOpacity style={[s.addBtn, { backgroundColor: C.accent }]} onPress={addGrocery}><Text style={s.addBtnText}>Add</Text></TouchableOpacity>
            </View>
            <Text style={[s.hint, { color: C.muted }]}>{grocery.filter(g => !g.done).length} items remaining</Text>
            {grocery.map(item => (
              <TouchableOpacity key={item.id} style={s.groceryRow} onPress={() => toggleGrocery(item.id)}>
                <View style={[s.check, item.done && { backgroundColor: C.green, borderColor: C.green }]}>
                  {item.done && <Text style={s.checkMark}>✓</Text>}
                </View>
                <Text style={[s.groceryText, { color: item.done ? C.muted : C.text, textDecorationLine: item.done ? 'line-through' : 'none' }]}>{item.text}</Text>
              </TouchableOpacity>
            ))}
            {grocery.length === 0 && <Text style={[s.empty, { color: C.muted }]}>List is empty. Add items above.</Text>}
            {grocery.some(g => g.done) && (
              <TouchableOpacity style={[s.clearBtn, { backgroundColor: C.redSoft }]} onPress={async () => { const u = grocery.filter(g => !g.done); setGrocery(u); await save('grocery', u); }}>
                <Text style={[s.clearBtnText, { color: C.red }]}>Clear completed items</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* BILLS */}
        {tab === 'bills' && (
          <>
            {dueThisWeek.length > 0 && (
              <View style={[s.alertCard, { backgroundColor: C.orangeSoft, borderColor: C.orange + '44' }]}>
                <Text style={[s.alertText, { color: C.orange }]}>⚠️ {dueThisWeek.length} bill{dueThisWeek.length > 1 ? 's' : ''} due this week!</Text>
              </View>
            )}
            <View style={s.card}>
              <Text style={s.cardTitle}>Add Bill</Text>
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Bill name" placeholderTextColor={C.muted} value={newBill.name} onChangeText={v => setNewBill(p => ({ ...p, name: v }))} />
                <TextInput style={[s.input, { flex: 0.5 }]} placeholder="₨ Amount" placeholderTextColor={C.muted} keyboardType="numeric" value={newBill.amount} onChangeText={v => setNewBill(p => ({ ...p, amount: v }))} />
              </View>
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 0.4 }]} placeholder="Due day (1-31)" placeholderTextColor={C.muted} keyboardType="numeric" value={newBill.dueDay} onChangeText={v => setNewBill(p => ({ ...p, dueDay: v }))} />
                <TouchableOpacity style={[s.addBtn, { backgroundColor: C.accent, flex: 1 }]} onPress={addBill}><Text style={s.addBtnText}>Add Bill</Text></TouchableOpacity>
              </View>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>Monthly Bills</Text>
              <Text style={[s.hint, { color: C.muted }]}>Total: ₨{bills.reduce((s, b) => s + parseFloat(b.amount || 0), 0).toLocaleString()}/month</Text>
              {bills.map(bill => (
                <View key={bill.id} style={[s.billRow, bill.paid && { opacity: 0.5 }]}>
                  <Text style={{ fontSize: 22 }}>{BILL_ICONS[bill.type] || '📋'}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[s.billName, { color: C.text }]}>{bill.name}</Text>
                    <Text style={[s.billDue, { color: C.muted }]}>Due: {bill.dueDay ? `${bill.dueDay}th of month` : 'Not set'}</Text>
                  </View>
                  <Text style={[s.billAmt, { color: bill.paid ? C.green : C.orange }]}>₨{parseFloat(bill.amount).toLocaleString()}</Text>
                  <TouchableOpacity style={[s.paidBtn, { backgroundColor: bill.paid ? C.greenSoft : C.surface, borderColor: bill.paid ? C.green : C.border }]} onPress={() => toggleBillPaid(bill.id)}>
                    <Text style={[s.paidBtnText, { color: bill.paid ? C.green : C.muted }]}>{bill.paid ? '✓ Paid' : 'Mark Paid'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {bills.length === 0 && <Text style={[s.empty, { color: C.muted }]}>No bills added yet.</Text>}
            </View>
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
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },
  statLabel: { color: C.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statNum: { fontSize: 20, fontWeight: '800' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bigNum: { fontSize: 20, fontWeight: '800' },
  barBg: { height: 6, backgroundColor: C.border, borderRadius: 99 },
  barFill: { height: 6, borderRadius: 99 },
  hint: { fontSize: 12 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: { backgroundColor: C.surface, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  catBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, marginRight: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  catText: { fontSize: 12, fontWeight: '600' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  expenseCat: { fontSize: 22, marginRight: 10 },
  expenseNote: { fontSize: 14, fontWeight: '600' },
  expenseDate: { fontSize: 11, marginTop: 2 },
  expenseAmt: { fontSize: 15, fontWeight: '800' },
  groceryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  check: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  groceryText: { flex: 1, fontSize: 15 },
  clearBtn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  clearBtnText: { fontWeight: '700' },
  alertCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  alertText: { fontWeight: '700', fontSize: 14 },
  billRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  billName: { fontSize: 14, fontWeight: '600' },
  billDue: { fontSize: 12, marginTop: 2 },
  billAmt: { fontSize: 15, fontWeight: '800', marginRight: 10 },
  paidBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  paidBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
});
