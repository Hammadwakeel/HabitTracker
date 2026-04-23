import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEMES = [
  {
    id: 'dark', name: 'Midnight', emoji: '🌑', preview: '#0D0F14',
    colors: {
      bg: '#0D0F14', surface: '#161820', card: '#1E2028', border: '#2A2D38',
      text: '#F1F5F9', muted: '#64748B', white: '#FFFFFF',
      accent: '#6C63FF', accentSoft: '#6C63FF22',
      green: '#4ADE80', greenSoft: '#4ADE8022', orange: '#FB923C', orangeSoft: '#FB923C22',
      purple: '#8B5CF6', purpleSoft: '#8B5CF618', teal: '#10B981', tealSoft: '#10B98118',
      yellow: '#F59E0B', yellowSoft: '#F59E0B18', red: '#F87171', redSoft: '#F8717118',
      blue: '#38BDF8', blueSoft: '#38BDF818', gold: '#FBBF24', goldSoft: '#FBBF2418',
      emerald: '#34D399', emeraldSoft: '#34D39918',
    },
  },
  {
    id: 'light', name: 'Daylight', emoji: '☀️', preview: '#F8FAFC',
    colors: {
      bg: '#F8FAFC', surface: '#FFFFFF', card: '#FFFFFF', border: '#E2E8F0',
      text: '#0F172A', muted: '#94A3B8', white: '#FFFFFF',
      accent: '#6C63FF', accentSoft: '#6C63FF15',
      green: '#16A34A', greenSoft: '#16A34A15', orange: '#EA580C', orangeSoft: '#EA580C15',
      purple: '#7C3AED', purpleSoft: '#7C3AED15', teal: '#0D9488', tealSoft: '#0D948815',
      yellow: '#D97706', yellowSoft: '#D9770615', red: '#DC2626', redSoft: '#DC262615',
      blue: '#0284C7', blueSoft: '#0284C715', gold: '#D97706', goldSoft: '#D9770615',
      emerald: '#059669', emeraldSoft: '#05966915',
    },
  },
  {
    id: 'ocean', name: 'Ocean', emoji: '🌊', preview: '#0C1A2E',
    colors: {
      bg: '#0C1A2E', surface: '#112240', card: '#1A2F4A', border: '#1E3A5F',
      text: '#CCD6F6', muted: '#8892B0', white: '#FFFFFF',
      accent: '#64FFDA', accentSoft: '#64FFDA22',
      green: '#64FFDA', greenSoft: '#64FFDA22', orange: '#FFB347', orangeSoft: '#FFB34722',
      purple: '#BD93F9', purpleSoft: '#BD93F922', teal: '#64FFDA', tealSoft: '#64FFDA22',
      yellow: '#F1FA8C', yellowSoft: '#F1FA8C22', red: '#FF5555', redSoft: '#FF555522',
      blue: '#6FC3DF', blueSoft: '#6FC3DF22', gold: '#F1FA8C', goldSoft: '#F1FA8C22',
      emerald: '#64FFDA', emeraldSoft: '#64FFDA22',
    },
  },
  {
    id: 'forest', name: 'Forest', emoji: '🌲', preview: '#0D1F0D',
    colors: {
      bg: '#0D1F0D', surface: '#162416', card: '#1C2E1C', border: '#2A3D2A',
      text: '#D4E6C3', muted: '#7A9B6A', white: '#FFFFFF',
      accent: '#76C442', accentSoft: '#76C44222',
      green: '#76C442', greenSoft: '#76C44222', orange: '#F4A460', orangeSoft: '#F4A46022',
      purple: '#B19CD9', purpleSoft: '#B19CD922', teal: '#4CAF80', tealSoft: '#4CAF8022',
      yellow: '#F0D060', yellowSoft: '#F0D06022', red: '#E05050', redSoft: '#E0505022',
      blue: '#5BA3C9', blueSoft: '#5BA3C922', gold: '#F0D060', goldSoft: '#F0D06022',
      emerald: '#4CAF80', emeraldSoft: '#4CAF8022',
    },
  },
  {
    id: 'rose', name: 'Rose Gold', emoji: '🌸', preview: '#1A0E10',
    colors: {
      bg: '#1A0E10', surface: '#251316', card: '#2E1A1D', border: '#3D2226',
      text: '#F9E4E8', muted: '#A07880', white: '#FFFFFF',
      accent: '#F4A4B0', accentSoft: '#F4A4B022',
      green: '#90EE90', greenSoft: '#90EE9022', orange: '#FFB347', orangeSoft: '#FFB34722',
      purple: '#E6B0E6', purpleSoft: '#E6B0E622', teal: '#80D0C0', tealSoft: '#80D0C022',
      yellow: '#FFD700', yellowSoft: '#FFD70022', red: '#FF6B8A', redSoft: '#FF6B8A22',
      blue: '#A0C0E8', blueSoft: '#A0C0E822', gold: '#FFD700', goldSoft: '#FFD70022',
      emerald: '#90EE90', emeraldSoft: '#90EE9022',
    },
  },
  {
    id: 'galaxy', name: 'Galaxy', emoji: '🔮', preview: '#0D0820',
    colors: {
      bg: '#0D0820', surface: '#150E30', card: '#1C1240', border: '#2A1A5E',
      text: '#E8E0FF', muted: '#9080C0', white: '#FFFFFF',
      accent: '#A855F7', accentSoft: '#A855F722',
      green: '#86EFAC', greenSoft: '#86EFAC22', orange: '#FCA5A5', orangeSoft: '#FCA5A522',
      purple: '#C084FC', purpleSoft: '#C084FC22', teal: '#67E8F9', tealSoft: '#67E8F922',
      yellow: '#FDE68A', yellowSoft: '#FDE68A22', red: '#FCA5A5', redSoft: '#FCA5A522',
      blue: '#93C5FD', blueSoft: '#93C5FD22', gold: '#FDE68A', goldSoft: '#FDE68A22',
      emerald: '#6EE7B7', emeraldSoft: '#6EE7B722',
    },
  },
  {
    id: 'desert', name: 'Desert', emoji: '🏜️', preview: '#1C1208',
    colors: {
      bg: '#1C1208', surface: '#2A1C0E', card: '#342416', border: '#4A3420',
      text: '#F5E6C8', muted: '#A08060', white: '#FFFFFF',
      accent: '#F0A030', accentSoft: '#F0A03022',
      green: '#90BE6D', greenSoft: '#90BE6D22', orange: '#F0A030', orangeSoft: '#F0A03022',
      purple: '#C9A0DC', purpleSoft: '#C9A0DC22', teal: '#70C0A0', tealSoft: '#70C0A022',
      yellow: '#F0D050', yellowSoft: '#F0D05022', red: '#E06040', redSoft: '#E0604022',
      blue: '#80B0D0', blueSoft: '#80B0D022', gold: '#F0D050', goldSoft: '#F0D05022',
      emerald: '#70C0A0', emeraldSoft: '#70C0A022',
    },
  },
  {
    id: 'neon', name: 'Neon City', emoji: '🌆', preview: '#050510',
    colors: {
      bg: '#050510', surface: '#0A0A20', card: '#10103A', border: '#1A1A50',
      text: '#F0F0FF', muted: '#6060A0', white: '#FFFFFF',
      accent: '#00F5FF', accentSoft: '#00F5FF22',
      green: '#39FF14', greenSoft: '#39FF1422', orange: '#FF6600', orangeSoft: '#FF660022',
      purple: '#FF00FF', purpleSoft: '#FF00FF22', teal: '#00F5FF', tealSoft: '#00F5FF22',
      yellow: '#FFE800', yellowSoft: '#FFE80022', red: '#FF073A', redSoft: '#FF073A22',
      blue: '#00F5FF', blueSoft: '#00F5FF22', gold: '#FFE800', goldSoft: '#FFE80022',
      emerald: '#39FF14', emeraldSoft: '#39FF1422',
    },
  },
];

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem('themeId').then(v => { if (v) setThemeId(v); });
  }, []);

  const setTheme = async (id) => {
    setThemeId(id);
    await AsyncStorage.setItem('themeId', id);
  };

  const current = THEMES.find(t => t.id === themeId) || THEMES[0];
  const C = current.colors;
  const isDark = current.id !== 'light';

  // Legacy toggle for backward compat
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ C, themeId, setTheme, toggle, isDark, themes: THEMES, currentTheme: current }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
