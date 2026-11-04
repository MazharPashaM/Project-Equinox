import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Modal, Pressable, Image, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIUS, SHADOWS, useTheme } from '../theme';

const { width } = Dimensions.get('window');
const PADDING_HORIZONTAL = 20;
const FAB_SIZE = 60;
const GAP = 15;
const PILL_WIDTH = width - (PADDING_HORIZONTAL * 2) - FAB_SIZE - GAP;
const TAB_WIDTH = PILL_WIDTH / 4;

export let globalNavDirection = 'right';

export default function CustomTabBar({ state, navigation }: any) {
  const { COLORS, isDark } = useTheme();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoDesc, setPhotoDesc] = useState('');
  
  const slideAnim = useRef(new Animated.Value(state.index)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: state.index, useNativeDriver: true, friction: 7, tension: 45 }).start();
  }, [state.index]);

  const toggleMenu = () => {
    if (isMenuOpen) closeMenu();
    else {
      setModalVisible(true);
      setIsMenuOpen(true);
      // Snappy spring animation matching the video reference
      Animated.spring(fabAnim, { toValue: 1, useNativeDriver: false, friction: 7, tension: 70 }).start();
    }
  };

  const closeMenu = (callback?: () => void) => {
    setIsMenuOpen(false);
    if (callback) callback(); 
    Animated.spring(fabAnim, { toValue: 0, useNativeDriver: false, friction: 8, tension: 70 }).start(() => setModalVisible(false));
  };

  const handleAddPhoto = async () => {
    closeMenu();
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const savePhotoLog = async () => {
    try {
      const newRecord = { type: 'photo', date: new Date().toISOString(), imageUri: photoUri, note: photoDesc };
      const existingData = await AsyncStorage.getItem('equinox_checkins');
      const checkinsArray = existingData ? JSON.parse(existingData) : [];
      checkinsArray.push(newRecord);
      await AsyncStorage.setItem('equinox_checkins', JSON.stringify(checkinsArray));
      setPhotoUri(null);
      setPhotoDesc('');
      navigation.navigate('Trend');
    } catch (error) { console.error(error); }
  };

  // Tab Indicator Animation
  const translateX = slideAnim.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2, TAB_WIDTH * 3] });
  const indicatorScaleX = slideAnim.interpolate({ inputRange: [0, 0.5, 1, 1.5, 2, 2.5, 3], outputRange: [1.25, 1.7, 1.25, 1.7, 1.25, 1.7, 1.25] });
  const indicatorScaleY = slideAnim.interpolate({ inputRange: [0, 0.5, 1, 1.5, 2, 2.5, 3], outputRange: [1.25, 0.85, 1.25, 0.85, 1.25, 0.85, 1.25] });
  
  // + Button Animations
  const fabRotate = fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const fabBgColor = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.accentAmber, isDark ? '#23314A' : '#DDE4F0'] });
  const fabIconColor = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [isDark ? COLORS.backgroundPrimary : '#FFFFFF', isDark ? '#FFFFFF' : '#14213D'] });
  
  // Pill Container Animations (Fades out when menu opens)
  const pillOpacity = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const pillScale = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });

  // Glass Menu Pop-up Animations (Grows out from the button origin)
  const menuScale = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] });
  const menuOpacity = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const menuTranslateY = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [90, 0] });
  const menuTranslateX = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });
  
  const overlayBg = fabAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [isDark ? 'rgba(7, 16, 57, 0)' : 'rgba(240, 244, 255, 0)', isDark ? 'rgba(7, 16, 57, 0.7)' : 'rgba(240, 244, 255, 0.7)'] 
  });

  const getIcon = (routeName: string, isFocused: boolean) => {
    const tint = isFocused ? COLORS.accentAmber : COLORS.textMuted;
    const baseIconColor = isDark ? 'FFFFFF' : '14213D';
    switch (routeName) {
      case 'Home': return <Image source={{ uri: `https://img.icons8.com/ios-filled/50/${baseIconColor}/sun--v1.png` }} style={[styles.icon, { tintColor: tint }]} />;
      case 'QuoteViewer': return <Image source={{ uri: `https://img.icons8.com/ios-filled/50/${baseIconColor}/quote.png` }} style={[styles.icon, { tintColor: tint }]} />;
      case 'Trend': return <Image source={{ uri: `https://img.icons8.com/ios-filled/50/${baseIconColor}/line-chart.png` }} style={[styles.icon, { tintColor: tint }]} />;
      case 'Profile': return <Image source={{ uri: `https://img.icons8.com/ios-filled/50/${baseIconColor}/layers.png` }} style={[styles.icon, { tintColor: tint }]} />;
    }
  };

  return (
    <View style={styles.container}>
      
      {/* Pop-up Menu Modal */}
      <Modal visible={modalVisible} transparent animationType="none">
        <Animated.View style={[styles.modalOverlay, { backgroundColor: overlayBg }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />
          
          <Animated.View style={[styles.actionMenuContainer, { 
            opacity: menuOpacity, 
            transform: [{ translateY: menuTranslateY }, { translateX: menuTranslateX }, { scale: menuScale }] 
          }]}>
            {/* Glassmorphic Panel Box */}
            <View style={[styles.actionMenuGlass, { 
              backgroundColor: isDark ? 'rgba(17, 35, 64, 0.75)' : 'rgba(255, 255, 255, 0.85)', 
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' 
            }]}>
              
              <TouchableOpacity style={[styles.actionGridItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} onPress={() => closeMenu(() => navigation.navigate('CheckIn'))}>
                <Image source={{ uri: 'https://img.icons8.com/ios-filled/50/19CFF0/smiling.png' }} style={[styles.actionMenuIcon, { tintColor: COLORS.accentCyan }]} />
                <Text style={[styles.actionMenuText, { color: COLORS.textPrimary }]}>Mood</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionGridItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} onPress={handleAddPhoto}>
                <Image source={{ uri: 'https://img.icons8.com/ios-filled/50/087EF5/image.png' }} style={[styles.actionMenuIcon, { tintColor: COLORS.accentElectricBlue }]} />
                <Text style={[styles.actionMenuText, { color: COLORS.textPrimary }]}>Photo</Text>
              </TouchableOpacity>
              
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Photo Logging Modal */}
      <Modal visible={!!photoUri} transparent animationType="slide">
        <View style={[styles.photoModalOverlay, { backgroundColor: isDark ? 'rgba(7, 16, 57, 0.95)' : 'rgba(240, 244, 255, 0.95)' }]}>
          <View style={[styles.photoFormBox, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
             <Image source={{ uri: photoUri || '' }} style={styles.previewImage} />
             <TextInput style={[styles.photoInput, { backgroundColor: COLORS.backgroundPrimary, color: COLORS.textPrimary }]} placeholder="Write a description..." placeholderTextColor={COLORS.textSecondary} value={photoDesc} onChangeText={setPhotoDesc} multiline autoFocus />
             <View style={styles.photoActions}>
               <TouchableOpacity onPress={() => setPhotoUri(null)}><Text style={[styles.cancelText, { color: COLORS.textSecondary }]}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.accentElectricBlue }]} onPress={savePhotoLog}><Text style={[styles.saveBtnText, { color: '#FFF' }]}>Save Memory</Text></TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* Main Tab Navigation Row */}
      <View style={styles.navRow}>
        
        {/* Pills container fades and scales down when menu opens */}
        <Animated.View style={[styles.pillContainer, { 
          backgroundColor: COLORS.backgroundSecondary, borderColor: COLORS.border,
          opacity: pillOpacity, transform: [{ scale: pillScale }] 
        }]}>
          <Animated.View style={[styles.slidingIndicator, { transform: [{ translateX }] }]}>
             <Animated.View style={[styles.indicatorInner, { backgroundColor: COLORS.surfaceCard, borderColor: 'rgba(252, 163, 17, 0.4)', transform: [{ scaleX: indicatorScaleX }, { scaleY: indicatorScaleY }] }]} />
          </Animated.View>
          
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const onPress = () => {
              globalNavDirection = index > state.index ? 'right' : 'left';
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            const tabScale = slideAnim.interpolate({ inputRange: [index - 1, index, index + 1], outputRange: [1, 1.25, 1], extrapolate: 'clamp' });

            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.8}>
                <Animated.View style={[styles.tabContent, { transform: [{ scale: tabScale }] }]}>
                  {getIcon(route.name, isFocused)}
                  <Text style={[styles.tabLabel, { color: COLORS.textMuted }, isFocused && { color: COLORS.accentAmber, fontFamily: 'Manrope_800ExtraBold' }]}>{route.name === 'QuoteViewer' ? 'Quotes' : route.name}</Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* FAB Button */}
        <TouchableOpacity style={styles.fabButtonTouchable} onPress={toggleMenu} activeOpacity={1}>
          <Animated.View style={[styles.fabButton, { backgroundColor: fabBgColor, transform: [{ rotate: fabRotate }] }]}>
            <Animated.Text style={[styles.fabSymbol, { color: fabIconColor }]}>+</Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 25, left: PADDING_HORIZONTAL, right: PADDING_HORIZONTAL },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pillContainer: { width: PILL_WIDTH, height: 68, borderRadius: RADIUS.pill, flexDirection: 'row', alignItems: 'center', borderWidth: 1, ...SHADOWS.subtle },
  tabItem: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  tabContent: { alignItems: 'center', justifyContent: 'center' }, 
  icon: { width: 22, height: 22, marginBottom: 4 },
  tabLabel: { fontSize: 9, fontFamily: 'Manrope_600SemiBold' },
  slidingIndicator: { position: 'absolute', width: TAB_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  indicatorInner: { width: '75%', height: '75%', borderRadius: RADIUS.pill, borderWidth: 1, ...SHADOWS.glowAmber },
  
  fabButtonTouchable: { width: FAB_SIZE, height: FAB_SIZE, zIndex: 10 },
  fabButton: { width: '100%', height: '100%', borderRadius: FAB_SIZE / 2, justifyContent: 'center', alignItems: 'center', ...SHADOWS.subtle },
  fabSymbol: { fontSize: 32, fontFamily: 'Manrope_500Medium', marginTop: -2 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', paddingRight: PADDING_HORIZONTAL },
  actionMenuContainer: { marginBottom: 100, alignItems: 'flex-end', transformOrigin: 'bottom right' },
  
  // Replicating the grid panel from the video
  actionMenuGlass: { borderRadius: RADIUS.lg, padding: 15, borderWidth: 1, flexDirection: 'row', gap: 12, ...SHADOWS.subtle },
  actionGridItem: { width: 75, height: 75, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  actionMenuText: { fontSize: 13, fontFamily: 'Manrope_700Bold', marginTop: 8 },
  actionMenuIcon: { width: 26, height: 26 },
  
  photoModalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  photoFormBox: { borderRadius: RADIUS.lg, padding: 20, borderWidth: 1 },
  previewImage: { width: '100%', height: 300, borderRadius: RADIUS.md, marginBottom: 15 },
  photoInput: { padding: 15, borderRadius: RADIUS.md, height: 100, textAlignVertical: 'top', fontFamily: 'Manrope_500Medium', marginBottom: 20 },
  photoActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelText: { fontFamily: 'Manrope_700Bold', fontSize: 16, paddingLeft: 10 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: RADIUS.pill },
  saveBtnText: { fontFamily: 'Manrope_800ExtraBold' }
});