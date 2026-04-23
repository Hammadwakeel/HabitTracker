import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Dimensions, Platform
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';

const TAB_WIDTH = 72;
const TAB_HEIGHT = Platform.OS === 'ios' ? 72 : 60;

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { C } = useTheme();
  const scrollRef = useRef(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll to keep active tab visible
  useEffect(() => {
    const index = state.index;
    const scrollX = Math.max(0, (index * TAB_WIDTH) - (Dimensions.get('window').width / 2) + TAB_WIDTH / 2);
    scrollRef.current?.scrollTo({ x: scrollX, animated: true });

    Animated.spring(indicatorAnim, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [state.index]);

  return (
    <View style={[styles.wrapper, {
      backgroundColor: C.surface,
      borderTopColor: C.border,
      paddingBottom: Platform.OS === 'ios' ? 20 : 4,
    }]}>
      {/* Sliding indicator line */}
      <Animated.View style={[styles.indicator, {
        backgroundColor: C.accent,
        transform: [{ translateX: indicatorAnim }],
      }]} />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.title || route.name;
          const emoji = options.tabBarEmoji || '●';

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tab]}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              activeOpacity={0.7}
            >
              {/* Icon container */}
              <View style={[
                styles.iconWrap,
                focused && { backgroundColor: C.accentSoft },
              ]}>
                <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
              </View>

              {/* Label */}
              <Text style={[
                styles.label,
                { color: focused ? C.accent : C.muted },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 0,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: TAB_WIDTH,
    height: 2,
    borderRadius: 1,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  tab: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT - (Platform.OS === 'ios' ? 20 : 4),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  emoji: {
    fontSize: 18,
    opacity: 0.65,
  },
  emojiActive: {
    opacity: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
