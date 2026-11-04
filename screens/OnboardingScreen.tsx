import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme';

export default function OnboardingScreen({ navigation }: any) {
  const [nickname, setNickname] = useState('');
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });

  const fadeLogo = useRef(new Animated.Value(0)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeInput = useRef(new Animated.Value(0)).current;
  const fadeBtn = useRef(new Animated.Value(0)).current;
  const slideLogo = useRef(new Animated.Value(30)).current;
  const slideTitle = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(fadeLogo, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideLogo, { toValue: 0, friction: 8, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideTitle, { toValue: 0, duration: 500, useNativeDriver: true })
      ]),
      Animated.timing(fadeInput, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(fadeBtn, { toValue: 1, duration: 350, useNativeDriver: true })
    ]).start();
  }, []);

  const handleContinue = async () => {
    if (!nickname.trim()) {
      setToast({ visible: true, title: 'Required', message: 'Please enter a nickname to continue.' });
      return;
    }
    try {
      await AsyncStorage.setItem('equinox_nickname', nickname);
      // Directs to CheckIn and passes a flag indicating it is the first launch
      navigation.replace('CheckIn', { isInitial: true });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <LinearGradient 
      colors={[COLORS.backgroundPrimary, COLORS.backgroundSecondary, COLORS.backgroundPrimary]} 
      style={styles.container}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <Animated.View style={[styles.logoContainer, { opacity: fadeLogo, transform: [{ translateY: slideLogo }] }]}>
          <Image 
            source={require('../assets/Equinox Logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.formContainer, { opacity: fadeTitle, transform: [{ translateY: slideTitle }] }]}>
          <Text style={styles.title}>Welcome to Equinox</Text>
          <Text style={styles.subtitle}>
            Balancing your academic growth with your mental wellbeing. What should we call you?
          </Text>
        </Animated.View>

        <Animated.View style={[styles.inputAndActions, { opacity: fadeInput }]}>
          <TextInput 
            style={styles.inputRounded}
            placeholder="Your Nickname"
            placeholderTextColor={COLORS.textMuted}
            value={nickname}
            onChangeText={setNickname}
            selectionColor={COLORS.accentCyan}
          />

          <Animated.View style={{ opacity: fadeBtn, width: '100%', alignItems: 'center' }}>
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
              <Text style={styles.continueBtnText}>Begin Journey</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>

      <Modal transparent visible={toast.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.toastBox}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <Text style={styles.toastMessage}>{toast.message}</Text>
            <TouchableOpacity style={styles.toastBtn} onPress={() => setToast({ ...toast, visible: false })}>
              <Text style={styles.toastBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center' },

  logoContainer: { alignItems: 'center', marginBottom: SPACING.xl, ...SHADOWS.glowCyan },
  logoImage: { width: 160, height: 160, borderRadius: RADIUS.lg }, 

  formContainer: { paddingHorizontal: SPACING.xl, alignItems: 'center' },
  title: { fontSize: 32, fontFamily: 'Manrope_800ExtraBold', color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'Manrope_500Medium', color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, paddingHorizontal: SPACING.md, lineHeight: 24 },
  
  inputAndActions: { width: '100%', alignItems: 'center', paddingHorizontal: 40 },
  inputRounded: { width: '100%', backgroundColor: COLORS.surfaceCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, color: COLORS.textPrimary, fontSize: 18, fontFamily: 'Manrope_600SemiBold', paddingVertical: 16, paddingHorizontal: 20, textAlign: 'center', marginBottom: SPACING.xl },
  
  continueBtn: { backgroundColor: COLORS.accentElectricBlue, width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, alignItems: 'center', marginBottom: SPACING.lg, ...SHADOWS.glowCyan },
  continueBtnText: { color: COLORS.textPrimary, fontSize: 16, fontFamily: 'Manrope_700Bold', letterSpacing: 0.5 },

  termsText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10, fontFamily: 'Manrope_500Medium' },
  termsLink: { textDecorationLine: 'underline', color: COLORS.accentAmber, fontFamily: 'Manrope_700Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(6, 19, 37, 0.8)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  toastBox: { width: '85%', backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.subtle },
  toastTitle: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold', color: COLORS.statusWarning, marginBottom: 10, textAlign: 'center' },
  toastMessage: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 25, lineHeight: 22, fontFamily: 'Manrope_500Medium' },
  toastBtn: { backgroundColor: COLORS.accentCyan, paddingVertical: 14, paddingHorizontal: 35, borderRadius: RADIUS.md, width: '100%', alignItems: 'center' },
  toastBtnText: { color: COLORS.backgroundPrimary, fontSize: 16, fontFamily: 'Manrope_700Bold' }
});