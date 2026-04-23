import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const COLORS = ['#6C63FF','#4ADE80','#FB923C','#F59E0B','#F87171','#38BDF8','#A855F7','#10B981','#FBBF24'];

const Particle = ({ delay }) => {
  const x = useRef(new Animated.Value(Math.random() * W)).current;
  const y = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(Math.random() * 0.6 + 0.4)).current;

  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = Math.random() * 8 + 4;
  const isCircle = Math.random() > 0.5;

  useEffect(() => {
    const duration = Math.random() * 1200 + 1000;
    const targetX = (Math.random() * W * 1.4) - W * 0.2;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, { toValue: H * 0.75, duration, useNativeDriver: true }),
        Animated.timing(x, { toValue: targetX, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: Math.random() * 720 - 360, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.4, delay: duration * 0.6, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      width: size,
      height: isCircle ? size : size * 0.4,
      backgroundColor: color,
      borderRadius: isCircle ? size / 2 : 2,
      opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: rotate.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
        { scale },
      ],
    }} />
  );
};

export default function Confetti({ visible, count = 60 }) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Particle key={i} delay={i * 20} />
      ))}
    </View>
  );
}
