import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, StatusBar, ScrollView, Linking, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { RADIUS, SHADOWS, useTheme } from '../theme';
import { globalNavDirection } from '../components/CustomTabBar';

const { width } = Dimensions.get('window');

const GlassIcon = ({ name, color, isDarkTheme }: { name: any, color: string, isDarkTheme: boolean }) => (
  <View style={[styles.glassIconContainer, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
    <Feather name={name} size={22} color={color} />
  </View>
);

export default function CounsellorScreen({ navigation }: any) {
  const { COLORS, isDark } = useTheme();

  const screenSlideAnim = useRef(new Animated.Value(0)).current;
  const animHeader = useRef(new Animated.Value(0)).current;
  const animCard1 = useRef(new Animated.Value(0)).current;
  const animCard2 = useRef(new Animated.Value(0)).current;
  const animCard3 = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const startX = globalNavDirection === 'right' ? width * 0.15 : -width * 0.15;
      screenSlideAnim.setValue(startX);
      [animHeader, animCard1, animCard2, animCard3].forEach(a => a.setValue(0));

      Animated.parallel([
        Animated.spring(screenSlideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.stagger(100, [
          Animated.spring(animHeader, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animCard1, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animCard2, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animCard3, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        ])
      ]).start();

      return () => screenSlideAnim.stopAnimation();
    }, [])
  );

  const getSlideStyle = (animValue: Animated.Value, translateYOffset = 25) => ({
    opacity: animValue,
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [translateYOffset, 0] }) }]
  });

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.backgroundPrimary} />
      <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.15)' : 'rgba(8, 126, 245, 0.15)' }]} />

      <Animated.View style={[styles.headerAbsolute, getSlideStyle(animHeader, 15)]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
          <Text style={[styles.backIcon, { color: COLORS.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Support</Text>
      </Animated.View>

      <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ transform: [{ translateX: screenSlideAnim }] }}>
        
        <Animated.View style={[styles.section, getSlideStyle(animCard1)]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Campus Counselor</Text>
          <View style={[styles.card, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <View style={styles.cardHeader}>
              <GlassIcon name="user" color={COLORS.accentCyan} isDarkTheme={isDark} />
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: COLORS.textPrimary }]}>Student Wellness Center</Text>
                <Text style={[styles.cardSubtitle, { color: COLORS.textSecondary }]}>Confidential sessions available</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.accentElectricBlue }]} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, getSlideStyle(animCard2)]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>National Helplines</Text>
          <TouchableOpacity style={[styles.helpCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} onPress={() => Linking.openURL('tel:18005990019')} activeOpacity={0.7}>
            <View style={styles.helpTextCol}>
              <Text style={[styles.helpTitle, { color: COLORS.textPrimary }]}>Kiran Mental Health</Text>
              <Text style={[styles.helpDesc, { color: COLORS.textSecondary }]}>24/7 Toll-Free Support</Text>
            </View>
            <View style={[styles.callBtn, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]}><Feather name="phone-call" size={16} color={COLORS.statusDanger} /></View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.helpCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} onPress={() => Linking.openURL('tel:112')} activeOpacity={0.7}>
            <View style={styles.helpTextCol}>
              <Text style={[styles.helpTitle, { color: COLORS.textPrimary }]}>National Emergency</Text>
              <Text style={[styles.helpDesc, { color: COLORS.textSecondary }]}>Police & Medical (112)</Text>
            </View>
            <View style={[styles.callBtn, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]}><Feather name="alert-triangle" size={16} color={COLORS.statusDanger} /></View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, getSlideStyle(animCard3)]}>
          <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.1)' : 'rgba(8, 126, 245, 0.1)', borderColor: COLORS.border }]}>
            <Feather name="info" size={20} color={COLORS.accentCyan} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: COLORS.textSecondary }]}>
              Seeking help is a sign of strength. Your conversations with professional counselors are strictly confidential.
            </Text>
          </View>
        </Animated.View>

      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, filter: 'blur(40px)', opacity: 0.8 },
  headerAbsolute: { position: 'absolute', top: Platform.OS === 'ios' ? 55 : 42, left: 20, right: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginRight: 15 },
  backIcon: { fontSize: 22, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 120, paddingBottom: 50 },
  
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontFamily: 'Manrope_800ExtraBold', marginBottom: 15 },
  
  card: { borderRadius: RADIUS.lg, padding: 20, borderWidth: 1, ...SHADOWS.subtle },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  glassIconContainer: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, fontFamily: 'Manrope_500Medium' },
  
  primaryBtn: { width: '100%', paddingVertical: 16, borderRadius: RADIUS.pill, alignItems: 'center', ...SHADOWS.subtle },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1 },
  
  helpCard: { flexDirection: 'row', borderRadius: RADIUS.md, padding: 18, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, ...SHADOWS.subtle },
  helpTextCol: { flex: 1, paddingRight: 15 },
  helpTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, marginBottom: 4 },
  helpDesc: { fontFamily: 'Manrope_500Medium', fontSize: 13 },
  callBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  infoBox: { flexDirection: 'row', padding: 20, borderRadius: RADIUS.md, borderWidth: 1 },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Manrope_500Medium', lineHeight: 22 }
});