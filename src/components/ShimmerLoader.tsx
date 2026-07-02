import React, { useEffect } from 'react';
import { View, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ShimmerLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
}

export default function ShimmerLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8, 
  className = '' 
}: ShimmerLoaderProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 750 }),
        withTiming(0.3, { duration: 750 })
      ),
      -1, // Loop infinitely
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[{ width, height, borderRadius }, animatedStyle]}
      className={`bg-neutral-200 dark:bg-neutral-800/80 ${className}`}
    />
  );
}
