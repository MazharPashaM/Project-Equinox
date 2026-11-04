import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Animated, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, SHADOWS, useTheme } from '../theme';
import { globalNavDirection } from '../components/CustomTabBar';

const { width, height } = Dimensions.get('window');

const QUOTES_DATA = [
  { id: '1', category: 'Mindfulness', quote: "Peace comes from within. Do not seek it without.", author: "Buddha", image: "https://picsum.photos/id/10/800/1200" },
  { id: '2', category: 'General', quote: "The surest way to make your dreams come true is to live them.", author: "Roy T. Bennett", image: "https://picsum.photos/id/11/800/1200" },
  { id: '3', category: 'General', quote: "Things work out best for those who make the best of how things work out.", author: "John Wooden", image: "https://picsum.photos/id/12/800/1200" },
  { id: '4', category: 'General', quote: "Persistence guarantees that results are inevitable.", author: "Paramahansa Yogananda", image: "https://picsum.photos/id/13/800/1200" },
  { id: '5', category: 'Inner Peace', quote: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati", image: "https://picsum.photos/id/14/800/1200" },
  { id: '6', category: 'Growth', quote: "Every moment is a fresh beginning.", author: "T.S. Eliot", image: "https://picsum.photos/id/15/800/1200" },
  { id: '7', category: 'Motivation', quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", image: "https://picsum.photos/id/16/800/1200" },
  { id: '8', category: 'Mindfulness', quote: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill", image: "https://picsum.photos/id/17/800/1200" },
  { id: '9', category: 'Action', quote: "Act as if what you do makes a difference. It does.", author: "William James", image: "https://picsum.photos/id/28/800/1200" },
  { id: '10', category: 'Courage', quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", image: "https://picsum.photos/id/29/800/1200" },
];

export default function QuoteViewerScreen() {
  const { COLORS, isDark } = useTheme();
  const [quotes, setQuotes] = useState<typeof QUOTES_DATA>([]);
  const [listHeight, setListHeight] = useState(height);
  const flatListRef = useRef<FlatList>(null);
  
  const screenSlide = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const quoteMarkScale = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const shuffled = [...QUOTES_DATA].sort(() => Math.random() - 0.5);
      setQuotes(shuffled);
      if (flatListRef.current) flatListRef.current.scrollToOffset({ offset: 0, animated: false });

      const startX = globalNavDirection === 'right' ? width * 0.15 : -width * 0.15;
      screenSlide.setValue(startX);
      screenOpacity.setValue(0);
      quoteMarkScale.setValue(0);
      textTranslate.setValue(20);
      textOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(screenSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.timing(screenOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.stagger(150, [
          Animated.spring(quoteMarkScale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(textTranslate, { toValue: 0, friction: 6, useNativeDriver: true })
          ])
        ])
      ]).start();
      
    }, [screenSlide, screenOpacity, quoteMarkScale, textTranslate, textOpacity])
  );

  const renderQuote = ({ item }: { item: typeof QUOTES_DATA[0] }) => (
    <View style={{ width, height: listHeight }}>
      <Image source={{ uri: item.image }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(7, 16, 57, 0.45)' : 'rgba(240, 244, 255, 0.55)' }]}>
        <View style={styles.topRow}>
          <Text style={[styles.creditText, { color: isDark ? 'rgba(255,255,255,0.6)' : COLORS.textSecondary }]}>Photography via Picsum</Text>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.quoteBlockWrapper}>
             <Animated.View style={[styles.quoteMarkContainer, { transform: [{ scale: quoteMarkScale }] }]}>
                <Text style={styles.quoteMark}>"</Text>
             </Animated.View>
             
             <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }] }}>
                <Text style={[styles.quoteText, { color: isDark ? '#FFFFFF' : COLORS.textPrimary }]}>{item.quote}</Text>
                <Text style={[styles.authorText, { color: COLORS.accentElectricBlue }]}>— {item.author.toUpperCase()} —</Text>
             </Animated.View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <View style={[styles.categoryPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(8, 126, 245, 0.15)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : COLORS.border }]}>
            <Text style={[styles.categoryText, { color: isDark ? '#FFFFFF' : COLORS.textPrimary }]}>{item.category}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { backgroundColor: COLORS.backgroundPrimary, opacity: screenOpacity, transform: [{ translateX: screenSlide }] }]}>
      <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.2)' : 'rgba(8, 126, 245, 0.2)' }]} />
      <FlatList
        ref={flatListRef}
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderQuote}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews={false} 
        initialNumToRender={20} 
        windowSize={21}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        getItemLayout={(_, index) => ({ length: listHeight, offset: listHeight * index, index })}
      />
      <LinearGradient colors={['transparent', COLORS.backgroundPrimary]} style={styles.bottomGradientMask} pointerEvents="none" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, filter: 'blur(40px)', opacity: 0.8, zIndex: 99 },
  overlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 30, paddingTop: 60, paddingBottom: 130 },
  topRow: { alignItems: 'flex-end', marginTop: 10 },
  creditText: { fontSize: 11, fontFamily: 'Manrope_600SemiBold', textDecorationLine: 'underline' },
  centerContent: { flex: 1, justifyContent: 'center' },
  quoteBlockWrapper: { width: '100%', paddingHorizontal: 10 },
  quoteMarkContainer: { marginBottom: -35, marginLeft: -10 },
  quoteMark: { fontSize: 75, fontFamily: 'Manrope_800ExtraBold', color: 'rgba(252, 163, 17, 0.7)', ...SHADOWS.glowAmber },
  quoteText: { fontSize: 26, fontFamily: 'Manrope_700Bold', lineHeight: 36, textAlign: 'left', marginBottom: 25, zIndex: 1 },
  authorText: { fontSize: 13, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 2, textAlign: 'left' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
  categoryPill: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADIUS.pill, borderWidth: 1 },
  categoryText: { fontSize: 13, fontFamily: 'Manrope_700Bold', letterSpacing: 0.5 },
  bottomGradientMask: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
});