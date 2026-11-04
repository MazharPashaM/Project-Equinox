import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Dimensions, Appearance, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import { captureScreen } from 'react-native-view-shot';
import MaskedView from '@react-native-masked-view/masked-view';

const { width, height } = Dimensions.get('window');

export const DARK_COLORS = {
  backgroundPrimary: '#071039',
  backgroundSecondary: '#0A1C38',
  backgroundGradient: ['#071039', '#0A1C38'] as const,
  surfaceCard: '#112340',
  surfaceElevated: '#1A2F50',
  accentElectricBlue: '#087EF5', 
  accentCyan: '#19CFF0',         
  accentAmber: '#FCA311',
  textPrimary: '#FFFFFF',
  textSecondary: '#A9B9D1',
  textMuted: '#6E82A6',
  border: '#1E3150',
  statusDanger: '#FF747D',
};

export const LIGHT_COLORS = {
  backgroundPrimary: '#F0F4FF',
  backgroundSecondary: '#FFFFFF',
  backgroundGradient: ['#F0F4FF', '#DFE9F5'] as const,
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#E3EDFF',
  accentElectricBlue: '#087EF5',
  accentCyan: '#0CAAC9',
  accentAmber: '#FCA311',
  textPrimary: '#071039',
  textSecondary: '#4A5B7D',
  textMuted: '#8B9CBE',
  border: '#D3DFFF',
  statusDanger: '#E63946',
};

export const COLORS = DARK_COLORS; 
export const RADIUS = { sm: 8, md: 16, lg: 24, xl: 32, pill: 999 };
export const SPACING = { sm: 8, md: 16, lg: 24, xl: 32 };
export const SHADOWS = {
  subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  glowAmber: { shadowColor: '#FCA311', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  glowCyan: { shadowColor: '#19CFF0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
};

type ThemeContextType = {
  isDark: boolean;
  COLORS: typeof DARK_COLORS;
  toggleTheme: (x: number, y: number) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  COLORS: DARK_COLORS,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const [animType, setAnimType] = useState<'expand' | 'collapse'>('expand');

  const progress = useSharedValue(0);
  const circleX = useSharedValue(0);
  const circleY = useSharedValue(0);
  const maxRadius = useSharedValue(0);

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem('equinox_theme');
      if (stored) setIsDark(stored === 'dark');
      else setIsDark(Appearance.getColorScheme() === 'dark');
    };
    loadTheme();
  }, []);

  const finishAnimation = () => {
    setIsAnimating(false);
    setSnapshotUri(null);
  };

  const toggleTheme = async (x: number, y: number) => {
    if (isAnimating) return;

    try {
      // Capture the screen exactly as it is right now
      const uri = await captureScreen({ format: 'jpg', quality: 0.7 });
      setSnapshotUri(uri);
    } catch (e) {
      console.warn("Screen capture failed, falling back to instant switch:", e);
      setIsDark(!isDark);
      return;
    }

    const nextIsDark = !isDark;
    const type = nextIsDark ? 'collapse' : 'expand';
    setAnimType(type);
    
    const maxR = Math.max(
      Math.sqrt(x * x + y * y),
      Math.sqrt((width - x) ** 2 + y ** 2),
      Math.sqrt(x ** 2 + (height - y) ** 2),
      Math.sqrt((width - x) ** 2 + (height - y) ** 2)
    );

    circleX.value = x;
    circleY.value = y;
    maxRadius.value = maxR;
    progress.value = type === 'expand' ? 0 : 1;
    
    // Mount the overlay immediately without flipping the theme yet
    setIsAnimating(true);
    
    // Save theme to memory
    await AsyncStorage.setItem('equinox_theme', nextIsDark ? 'dark' : 'light');

    // Wait a brief moment to ensure the overlay image is rendered before swapping React state
    setTimeout(() => {
      setIsDark(nextIsDark); // Swap actual theme under the mask
      
      // Fire smooth Reanimated mask transition
      progress.value = withTiming(
        type === 'expand' ? 1 : 0, 
        {
          duration: 750, // Slightly snappier for premium feel
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, 
        (finished) => {
          if (finished) runOnJS(finishAnimation)();
        }
      );
    }, 50); // 50ms mount buffer kills the jitter completely
  };

  const invertedMaskStyle = useAnimatedStyle(() => {
    const r = progress.value * maxRadius.value;
    const borderW = maxRadius.value * 2; 
    return {
      position: 'absolute',
      left: circleX.value - r - borderW,
      top: circleY.value - r - borderW,
      width: (r + borderW) * 2,
      height: (r + borderW) * 2,
      borderRadius: r + borderW,
      borderWidth: borderW,
      borderColor: 'black',
      backgroundColor: 'transparent',
    };
  });

  const standardMaskStyle = useAnimatedStyle(() => {
    const r = progress.value * maxRadius.value;
    return {
      position: 'absolute',
      left: circleX.value - r,
      top: circleY.value - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      backgroundColor: 'black',
    };
  });

  const activeColors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, COLORS: activeColors, toggleTheme }}>
      <View style={{ flex: 1, backgroundColor: activeColors.backgroundPrimary }}>
        
        {/* Main App Content */}
        <View style={{ flex: 1 }}>
          {children}
        </View>

        {/* Transition Overlay */}
        {isAnimating && snapshotUri && (
          <MaskedView
            style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
            maskElement={
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                {animType === 'expand' ? (
                  <Animated.View style={invertedMaskStyle} />
                ) : (
                  <Animated.View style={standardMaskStyle} />
                )}
              </View>
            }
          >
            <Image source={{ uri: snapshotUri }} style={StyleSheet.absoluteFill} />
          </MaskedView>
        )}

      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);