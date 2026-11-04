import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons'; // Added Vector Icons
import { RADIUS, SHADOWS, useTheme } from '../theme';
import { globalNavDirection } from '../components/CustomTabBar';

const { width } = Dimensions.get('window');

const QUOTES = [
  "Peace comes from within. Do not seek it without.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Breathe in deep, and let go of what you cannot change.",
  "Every moment is a fresh beginning.",
  "Smile, breathe, and go slowly.",
];

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

// Reusable Glass Icon Component
const GlassIcon = ({ name, color, size = 20, isDarkTheme, isSolid = false }: { name: any, color: string, size?: number, isDarkTheme: boolean, isSolid?: boolean }) => (
  <View style={[styles.glassIconContainer, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
    {isSolid ? <Ionicons name={name} size={size} color={color} /> : <Feather name={name} size={size} color={color} />}
  </View>
);

export default function HomeScreen({ navigation }: any) {
  const { COLORS, isDark, toggleTheme } = useTheme();
  const [dailyQuote, setDailyQuote] = useState(QUOTES[0]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const slideAnim = useRef(new Animated.Value(0)).current; 
  const animHeader = useRef(new Animated.Value(0)).current;
  const animDate = useRef(new Animated.Value(0)).current;
  const animCalendar = useRef(new Animated.Value(0)).current;
  const animQuote = useRef(new Animated.Value(0)).current;
  const animRoutine = useRef(new Animated.Value(0)).current;
  const animBento = useRef(new Animated.Value(0)).current;
  const themeSwitchAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
      const startX = globalNavDirection === 'right' ? width * 0.15 : -width * 0.15;
      
      slideAnim.setValue(startX);
      [animHeader, animDate, animCalendar, animQuote, animRoutine, animBento].forEach(a => a.setValue(0));
      
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.stagger(50, [
          Animated.spring(animHeader, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animDate, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animCalendar, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animQuote, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animRoutine, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animBento, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        ])
      ]).start();
    }, [])
  );

  useEffect(() => {
    const initializeHome = async () => {
      try {
        const todayStr = new Date().toDateString();
        const storedQuoteDate = await AsyncStorage.getItem('equinox_quote_date');
        const storedQuoteText = await AsyncStorage.getItem('equinox_quote_text');

        if (storedQuoteDate === todayStr && storedQuoteText) setDailyQuote(storedQuoteText);
        else {
          const newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
          setDailyQuote(newQuote);
          await AsyncStorage.setItem('equinox_quote_date', todayStr);
          await AsyncStorage.setItem('equinox_quote_text', newQuote);
        }
      } catch (error) { console.error(error); }
    };
    initializeHome();
  }, []);

  const handleThemeToggle = (e: any) => {
    const { pageX, pageY } = e.nativeEvent;
    toggleTheme(pageX, pageY);
    Animated.sequence([
      Animated.timing(themeSwitchAnim, { toValue: isDark ? 0.5 : 0.5, duration: 150, useNativeDriver: true }),
      Animated.timing(themeSwitchAnim, { toValue: isDark ? 0 : 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const formattedFullDate = `${FULL_DAYS[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}`;
  const mondayDate = new Date(currentDate);
  mondayDate.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    return { id: d.toISOString(), dayLabel: SHORT_DAYS[d.getDay()], dayNum: d.getDate(), isToday: d.toDateString() === currentDate.toDateString() };
  });

  const getSlideStyle = (animValue: Animated.Value, translateYOffset = 25) => ({
    opacity: animValue,
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [translateYOffset, 0] }) }]
  });

  const switchRotate = themeSwitchAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const switchScale = themeSwitchAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.6, 1] });

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.15)' : 'rgba(8, 126, 245, 0.15)' }]} />

      <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        
        <Animated.View style={[styles.topHeader, getSlideStyle(animHeader, 15)]}>
          <Image source={require('../assets/Equinox Logo.png')} style={styles.headerLogo} resizeMode="contain" />
          
          <TouchableOpacity onPress={handleThemeToggle} style={[styles.profileBtn, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} activeOpacity={1}>
             <Animated.View style={{ transform: [{ rotate: switchRotate }, { scale: switchScale }] }}>
                <Feather name={isDark ? "moon" : "sun"} size={22} color={COLORS.accentAmber} />
             </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.calendarSection}>
          <Animated.View style={getSlideStyle(animDate)}>
             <Text style={[styles.todayText, { color: COLORS.textPrimary }]}>Today</Text>
             <Text style={[styles.fullDateText, { color: COLORS.accentAmber }]}>{formattedFullDate}</Text>
          </Animated.View>
          
          <Animated.View style={[styles.weekRow, getSlideStyle(animCalendar)]}>
            {weekDays.map((day) => (
              <View key={day.id} style={[styles.dayCol, day.isToday && { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border, borderWidth: 1 }]}>
                <Text style={[styles.dayLabel, { color: COLORS.textMuted }, day.isToday && { color: COLORS.textPrimary }]}>{day.dayLabel}</Text>
                <Text style={[styles.dayNum, { color: COLORS.textSecondary }, day.isToday && { color: COLORS.accentCyan, fontFamily: 'Manrope_800ExtraBold' }]}>{day.dayNum}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <Animated.View style={[styles.quoteCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }, getSlideStyle(animQuote)]}>
          <Text style={[styles.quoteTag, { color: COLORS.accentCyan }]}>DAILY MINDFULNESS</Text>
          <Text style={[styles.quoteText, { color: COLORS.textPrimary }]}>"{dailyQuote}"</Text>
        </Animated.View>

        <Animated.View style={getSlideStyle(animRoutine)}>
          <TouchableOpacity style={[styles.routineCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} onPress={() => navigation.navigate('CheckIn')}>
            <View style={styles.routineInfo}>
              <GlassIcon name="smile" color={COLORS.accentCyan} size={22} isDarkTheme={isDark} />
              <View style={styles.routineTextCol}>
                <Text style={[styles.routineTitle, { color: COLORS.textPrimary }]}>Daily Mood Check-in</Text>
                <Text style={[styles.routineDesc, { color: COLORS.textSecondary }]}>Track your emotional state and triggers</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.bentoGrid, getSlideStyle(animBento)]}>
          <TouchableOpacity style={[styles.bentoTile, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border, borderWidth: 1 }]} onPress={() => navigation.navigate('Trend')}>
            <View style={styles.tileHeader}>
              <GlassIcon name="bar-chart-2" color={COLORS.accentAmber} size={18} isDarkTheme={isDark} />
              <Text style={[styles.tileTitleLight, { color: COLORS.textPrimary }]}>Insights</Text>
            </View>
            <Text style={[styles.tileValueLight, { color: COLORS.textPrimary }]}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.bentoTile, { backgroundColor: COLORS.accentElectricBlue, ...SHADOWS.glowCyan }]} onPress={() => navigation.navigate('Breathe')}>
            <View style={styles.tileHeader}>
              <GlassIcon name="wind" color="#FFFFFF" size={18} isDarkTheme={isDark} />
              <Text style={[styles.tileTitleLight, { color: '#FFFFFF' }]}>Breathing</Text>
            </View>
            <Text style={[styles.tileValueLight, { color: '#FFFFFF' }]}>60 Sec</Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, filter: 'blur(40px)', opacity: 0.8, zIndex: 0 },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 130 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 5 },
  headerLogo: { width: 50, height: 50, borderRadius: 12 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  calendarSection: { marginBottom: 32 },
  todayText: { fontSize: 24, fontFamily: 'Manrope_700Bold', marginBottom: 4, textAlign: 'center' },
  fullDateText: { fontSize: 11, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase', textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 0 },
  dayCol: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: RADIUS.md },
  dayLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', marginBottom: 6 },
  dayNum: { fontSize: 16, fontFamily: 'Manrope_700Bold' },
  quoteCard: { borderRadius: RADIUS.lg, padding: 24, marginBottom: 24, borderWidth: 1, ...SHADOWS.subtle },
  quoteTag: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1.5, marginBottom: 8 },
  quoteText: { fontSize: 16, fontFamily: 'Manrope_600SemiBold', lineHeight: 24, fontStyle: 'italic' },
  routineCard: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, ...SHADOWS.subtle },
  routineInfo: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, paddingRight: 10 },
  glassIconContainer: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  routineTextCol: { flex: 1, justifyContent: 'center' },
  routineTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', marginBottom: 4 },
  routineDesc: { fontSize: 12, fontFamily: 'Manrope_500Medium' },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  bentoTile: { width: '47.5%', borderRadius: RADIUS.lg, padding: 20, height: 140, justifyContent: 'space-between', ...SHADOWS.subtle },
  tileHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tileTitleLight: { fontSize: 14, fontFamily: 'Manrope_700Bold' },
  tileValueLight: { fontSize: 20, fontFamily: 'Manrope_800ExtraBold' },
});