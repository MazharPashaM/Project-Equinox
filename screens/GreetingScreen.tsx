import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIUS, SHADOWS, useTheme } from '../theme';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function GreetingScreen({ navigation }: any) {
  const { COLORS, isDark } = useTheme();
  const [nickname, setNickname] = useState('Explorer');
  const [greeting, setGreeting] = useState('Welcome');

  const screenSlideAnim = useRef(new Animated.Value(0)).current;
  const animGreeting = useRef(new Animated.Value(0)).current;
  const animMessage = useRef(new Animated.Value(0)).current;
  const animButton = useRef(new Animated.Value(0)).current;
  const buttonBounce = useRef(new Animated.Value(1)).current;

  // Set time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    const loadName = async () => {
      try {
        const savedName = await AsyncStorage.getItem('equinox_nickname');
        if (savedName) setNickname(savedName);
      } catch (error) {
        console.warn(error);
      }
    };
    loadName();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Start slightly off-screen for a smooth slide-in
      screenSlideAnim.setValue(width * 0.15);
      [animGreeting, animMessage, animButton].forEach(a => a.setValue(0));

      Animated.parallel([
        Animated.spring(screenSlideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.stagger(150, [
          Animated.spring(animGreeting, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animMessage, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animButton, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        ])
      ]).start();
      
      return () => {
        screenSlideAnim.stopAnimation();
      };
    }, [])
  );

  // Premium button press animation
  const handlePressIn = () => {
    Animated.spring(buttonBounce, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonBounce, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
  };

  const handleContinue = () => {
    // We pass isInitial: true so CheckInScreen knows to route to MainTabs (Home) when finished
    navigation.replace('CheckIn', { isInitial: true });
  };

  const getSlideStyle = (animValue: Animated.Value, translateYOffset = 30) => ({
    opacity: animValue,
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [translateYOffset, 0] }) }]
  });

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.backgroundPrimary} />
      
      <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.15)' : 'rgba(8, 126, 245, 0.15)' }]} />

      <Animated.View style={[styles.contentWrapper, { transform: [{ translateX: screenSlideAnim }] }]}>
        
        <View style={styles.textContainer}>
          <Animated.View style={getSlideStyle(animGreeting)}>
            <Text style={[styles.greetingText, { color: COLORS.accentCyan }]}>{greeting},</Text>
            <Text style={[styles.nameText, { color: COLORS.textPrimary }]}>{nickname}.</Text>
          </Animated.View>

          <Animated.View style={getSlideStyle(animMessage, 40)}>
            <Text style={[styles.messageText, { color: COLORS.textSecondary }]}>
              Let's take a moment to pause and reflect on how you're feeling today.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.buttonContainer, getSlideStyle(animButton, 50)]}>
          <Animated.View style={{ transform: [{ scale: buttonBounce }] }}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleContinue}
              style={[styles.continueBtn, { backgroundColor: COLORS.accentElectricBlue }]}
            >
              <Text style={styles.continueBtnText}>BEGIN CHECK-IN</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" style={styles.arrowIcon} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  ambientGlow: { 
    position: 'absolute', 
    top: -100, 
    right: -100, 
    width: 350, 
    height: 350, 
    borderRadius: 175, 
    filter: 'blur(50px)', 
    opacity: 0.8, 
    zIndex: 0 
  },
  contentWrapper: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 35 
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 60,
  },
  greetingText: { 
    fontSize: 22, 
    fontFamily: 'Manrope_700Bold', 
    marginBottom: 8 
  },
  nameText: { 
    fontSize: 48, 
    fontFamily: 'Manrope_800ExtraBold', 
    lineHeight: 56,
    marginBottom: 24 
  },
  messageText: { 
    fontSize: 18, 
    fontFamily: 'Manrope_500Medium', 
    lineHeight: 28,
    paddingRight: 20
  },
  buttonContainer: {
    paddingBottom: 60,
  },
  continueBtn: { 
    width: '100%', 
    paddingVertical: 18, 
    borderRadius: RADIUS.pill, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    ...SHADOWS.subtle 
  },
  continueBtnText: { 
    fontSize: 15, 
    fontFamily: 'Manrope_800ExtraBold', 
    letterSpacing: 1.5,
    color: '#FFFFFF'
  },
  arrowIcon: {
    position: 'absolute',
    right: 24,
  }
});