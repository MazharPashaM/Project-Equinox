import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
  Modal,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { useTheme, RADIUS, SHADOWS } from '../theme';
import { useFocusEffect } from '@react-navigation/native';
import { globalNavDirection } from '../components/CustomTabBar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = Math.min(SCREEN_WIDTH - 100, 300);

const MOODS = [
  { label: 'BAD', value: 1, color: '#1D59BB' },
  { label: 'NOT BAD', value: 2, color: '#76B9FF' },
  { label: 'NEUTRAL', value: 3, color: '#AFC5F8' },
  { label: 'GOOD', value: 4, color: '#FEBD19' },
  { label: 'EXCELLENT', value: 5, color: '#FCA311' },
];

const ACTIVITIES = [
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'family', label: 'Family', icon: 'home' },
  { id: 'friends', label: 'Friends', icon: 'users' },
  { id: 'school', label: 'School', icon: 'book' },
  { id: 'relationship', label: 'Partner', icon: 'heart' },
  { id: 'traveling', label: 'Travel', icon: 'navigation' },
  { id: 'food', label: 'Food', icon: 'coffee' },
  { id: 'exercise', label: 'Exercise', icon: 'activity' },
  { id: 'health', label: 'Health', icon: 'plus-circle' },
  { id: 'hobbies', label: 'Hobbies', icon: 'feather' },
  { id: 'gaming', label: 'Gaming', icon: 'monitor' },
  { id: 'weather', label: 'Weather', icon: 'cloud' },
  { id: 'sleep', label: 'Sleep', icon: 'moon' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
  { id: 'music', label: 'Music', icon: 'headphones' },
];

const FEELINGS = [
  { id: 'happy', label: 'Happy', icon: 'smile' },
  { id: 'blessed', label: 'Blessed', icon: 'sun' },
  { id: 'good', label: 'Good', icon: 'thumbs-up' },
  { id: 'lucky', label: 'Lucky', icon: 'star' },
  { id: 'confused', label: 'Confused', icon: 'help-circle' },
  { id: 'bored', label: 'Bored', icon: 'meh' },
  { id: 'awkward', label: 'Awkward', icon: 'frown' },
  { id: 'stressed', label: 'Stressed', icon: 'zap' },
  { id: 'angry', label: 'Angry', icon: 'alert-octagon' },
  { id: 'anxious', label: 'Anxious', icon: 'wind' },
  { id: 'down', label: 'Down', icon: 'cloud-drizzle' },
  { id: 'other', label: 'Other', icon: 'more-horizontal' },
];

export default function CheckInScreen({ navigation, route }: any) {
  const { COLORS, isDark } = useTheme();
  const isInitial = route?.params?.isInitial || false;

  const [nickname, setNickname] = useState('Explorer');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentMoodIndex, setCurrentMoodIndex] = useState(2);
  const [showCounselorModal, setShowCounselorModal] = useState(false);

  const sliderAnim = useRef(new Animated.Value(SLIDER_WIDTH / 2)).current;
  const sliderVal = useRef(SLIDER_WIDTH / 2);
  const dragStart = useRef(SLIDER_WIDTH / 2);
  const [sliderWidth] = useState(SLIDER_WIDTH);

  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;
  const faceScale = useRef(new Animated.Value(1)).current;
  const faceTranslateY = useRef(new Animated.Value(0)).current;
  const faceFloat = useRef(new Animated.Value(0)).current;
  const faceBlink = useRef(new Animated.Value(1)).current;
  
  const gridItemAnims = useRef(ACTIVITIES.map(() => new Animated.Value(0))).current;
  const completionOpacity = useRef(new Animated.Value(0)).current; 
  const completionTitleAnim = useRef(new Animated.Value(0)).current;
  const completionSubAnim = useRef(new Animated.Value(0)).current;
  const completionBtnAnims = useRef(new Animated.Value(0)).current;

  const screenSlideAnim = useRef(new Animated.Value(0)).current;
  const entryBack = useRef(new Animated.Value(0)).current;
  const entryGreeting = useRef(new Animated.Value(0)).current;
  const entryFace = useRef(new Animated.Value(0)).current;
  const entryContent = useRef(new Animated.Value(0)).current;
  const entryBottom = useRef(new Animated.Value(0)).current;
  const transitionLocked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const startX = globalNavDirection === 'right' ? SCREEN_WIDTH * 0.15 : -SCREEN_WIDTH * 0.15;

      screenSlideAnim.setValue(startX);
      [entryBack, entryGreeting, entryFace, entryContent, entryBottom].forEach(animation => animation.setValue(0));

      Animated.parallel([
        Animated.timing(screenSlideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.stagger(40, [
          Animated.timing(entryBack, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(entryGreeting, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(entryFace, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(entryContent, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(entryBottom, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start();

      return () => {
        screenSlideAnim.stopAnimation();
        transitionLocked.current = false;
      };
    }, [])
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('equinox_nickname');
        if (savedName) setNickname(savedName);
        await Notifications.requestPermissionsAsync();
      } catch (error) {
        console.warn('Could not load initialization data:', error);
      }
    };
    loadData();

    const listener = sliderAnim.addListener(({ value }) => {
      sliderVal.current = value;
      const computedIndex = Math.min(4, Math.max(0, Math.round((value / sliderWidth) * 4)));
      setCurrentMoodIndex(computedIndex);
    });

    return () => sliderAnim.removeListener(listener);
  }, [sliderAnim, sliderWidth]);

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(faceFloat, { toValue: -4, duration: 1500, useNativeDriver: true }),
        Animated.timing(faceFloat, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );

    let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const blinkOnce = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.timing(faceBlink, { toValue: 0.08, duration: 85, useNativeDriver: true }),
        Animated.timing(faceBlink, { toValue: 1, duration: 110, useNativeDriver: true }),
      ]).start(() => {
        if (!cancelled) blinkTimeout = setTimeout(blinkOnce, 2600 + Math.random() * 900);
      });
    };

    floatLoop.start();
    blinkTimeout = setTimeout(blinkOnce, 1800);

    return () => {
      cancelled = true;
      floatLoop.stop();
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, [faceFloat, faceBlink]);

  const clamp = (value: number) => Math.max(0, Math.min(sliderWidth, value));

  const moveSliderTo = (value: number) => {
    const target = clamp(value);
    Animated.spring(sliderAnim, {
      toValue: target,
      useNativeDriver: false,
      friction: 7,
      tension: 55,
    }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => { dragStart.current = sliderVal.current; },
        onPanResponderMove: (_, gesture) => { sliderAnim.setValue(clamp(dragStart.current + gesture.dx)); },
        onPanResponderRelease: () => {
          const step = sliderWidth / 4;
          const snapped = Math.round(sliderVal.current / step) * step;
          moveSliderTo(snapped);
        },
      }),
    [sliderWidth, sliderAnim]
  );

  const moodOverlay = sliderAnim.interpolate({
    inputRange: [0, sliderWidth / 4, sliderWidth / 2, (sliderWidth * 3) / 4, sliderWidth],
    outputRange: MOODS.map(m => m.color),
    extrapolate: 'clamp',
  });

  const eyeScaleY = sliderAnim.interpolate({ inputRange: [0, sliderWidth / 2, sliderWidth], outputRange: [0.45, 1, 0.84], extrapolate: 'clamp' });
  const eyeScaleX = sliderAnim.interpolate({ inputRange: [0, sliderWidth / 2, sliderWidth], outputRange: [0.68, 1, 0.84], extrapolate: 'clamp' });
  const mouthScale = sliderAnim.interpolate({ inputRange: [0, sliderWidth / 2, sliderWidth], outputRange: [-0.9, 0.25, 1], extrapolate: 'clamp' });

  const toggleSelection = (id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(previous => {
      if (previous.includes(id)) return previous.filter(item => item !== id);
      if (previous.length < 10) return [...previous, id];
      return previous;
    });
  };

  const triggerGridAnimation = () => {
    gridItemAnims.forEach(anim => anim.setValue(0));
    Animated.stagger(35, gridItemAnims.map(anim => 
      Animated.spring(anim, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true })
    )).start();
  };

  const animateStepTransition = (nextStep: number, direction: 'forward' | 'backward') => {
    if (transitionLocked.current || nextStep < 1 || nextStep > 4) return;
    transitionLocked.current = true;

    const offset = direction === 'forward' ? -22 : 22;
    const incomingOffset = direction === 'forward' ? 22 : -22;

    stepOpacity.stopAnimation();
    stepTranslateX.stopAnimation();
    faceScale.stopAnimation();
    faceTranslateY.stopAnimation();

    Animated.parallel([
      Animated.timing(stepOpacity, { toValue: 0, duration: 95, useNativeDriver: true }),
      Animated.timing(stepTranslateX, { toValue: offset, duration: 120, useNativeDriver: true }),
      // Increased scaling and negative Y translation to tuck the face smoothly out of the way for the grid steps
      Animated.timing(faceScale, { toValue: nextStep === 1 ? 1 : 0.75, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(faceTranslateY, { toValue: nextStep === 1 ? 0 : -45, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }), 
    ]).start(({ finished }) => {
      if (!finished) {
        transitionLocked.current = false;
        return;
      }

      stepOpacity.setValue(0);
      stepTranslateX.setValue(incomingOffset);
      setCurrentStep(nextStep);
      
      if (nextStep === 2 || nextStep === 3) triggerGridAnimation();

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(stepOpacity, { toValue: 1, duration: 145, useNativeDriver: true }),
          Animated.spring(stepTranslateX, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start(() => { transitionLocked.current = false; });
      });
    });
  };

  const nextStep = () => {
    if (currentStep >= 4 || transitionLocked.current) return;
    animateStepTransition(currentStep + 1, 'forward');
  };

  const checkLowMoodAlerts = async (allCheckins: any[]) => {
    if (allCheckins.length < 3) return;
    const lastThree = allCheckins.slice(-3);
    const allLow = lastThree.every(item => item.mood < 3);

    if (allLow) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'We are here for you 💙', body: 'Consider reaching out to your campus counselor for support.', sound: true },
        trigger: null,
      });
      setShowCounselorModal(true);
    }
  };

  const saveCheckIn = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const clampedVal = clamp(sliderVal.current);
    const activeMood = Math.round((clampedVal / sliderWidth) * 4) + 1;

    try {
      const newRecord = { nickname, mood: activeMood, activities: selectedActivities, feelings: selectedFeelings, title, note, date: new Date().toISOString() };
      const existingData = await AsyncStorage.getItem('equinox_checkins');
      const checkinsArray = existingData ? JSON.parse(existingData) : [];
      checkinsArray.push(newRecord);

      await AsyncStorage.setItem('equinox_checkins', JSON.stringify(checkinsArray));
      await checkLowMoodAlerts(checkinsArray);

      completionOpacity.setValue(0);
      completionTitleAnim.setValue(0);
      completionSubAnim.setValue(0);
      completionBtnAnims.setValue(0);
      
      setCurrentStep(5);
      
      Animated.timing(completionOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      
      Animated.stagger(80, [
        Animated.spring(completionTitleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.spring(completionSubAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.spring(completionBtnAnims, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }) 
      ]).start();

    } catch (error) { console.error('Unable to save check-in:', error); } 
    finally { setIsSaving(false); }
  };

  const handleExit = () => {
    if (transitionLocked.current) return;
    if (currentStep > 1 && currentStep < 5) { animateStepTransition(currentStep - 1, 'backward'); return; }
    if (isInitial) { navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }); } 
    else { navigation.goBack(); }
  };

  const handleTrendNavigation = () => {
    if (isInitial) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Trend' }], index: 0 } }] });
    } else {
      navigation.navigate('MainTabs', { screen: 'Trend' });
    }
  };

  const handleBreatheNavigation = () => {
    if (isInitial) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Breathe' }], index: 0 } }] });
    } else {
      navigation.navigate('Breathe');
    }
  };

  const renderGrid = (data: typeof ACTIVITIES | typeof FEELINGS, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => (
    <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
      {data.map((item, index) => {
        const active = selected.includes(item.id);
        const animScale = gridItemAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
        const animOpacity = gridItemAnims[index];

        return (
          <Animated.View key={item.id} style={[styles.gridItemWrapper, { opacity: animOpacity, transform: [{ scale: animScale }] }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleSelection(item.id, selected, setSelected)}
              style={[
                styles.gridItem,
                { backgroundColor: active ? COLORS.surfaceElevated : COLORS.surfaceCard, borderColor: active ? COLORS.accentElectricBlue : COLORS.border },
              ]}
            >
              <View style={[styles.glassIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                 <Feather name={item.icon as any} size={22} color={active ? COLORS.textPrimary : COLORS.textSecondary} />
              </View>
              <Text style={[styles.gridLabel, { color: active ? COLORS.textPrimary : COLORS.textSecondary }]}>{item.label}</Text>
              
              {active && <View style={[styles.selectedIndicator, { backgroundColor: COLORS.accentElectricBlue }]} />}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );

  const getEntranceStyle = (animation: Animated.Value, translateY = 25) => ({
    opacity: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0], extrapolate: 'clamp' }) }],
  });

  const getBouncyStyle = (animation: Animated.Value, translateY = 40) => ({
    opacity: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0] }) }]
  });

  const moodColor = MOODS[currentMoodIndex]?.color || MOODS[2].color;

  return (
    <Animated.View style={[styles.container, { backgroundColor: COLORS.backgroundPrimary, transform: [{ translateX: screenSlideAnim }] }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.backgroundPrimary} />

      <LinearGradient colors={[COLORS.backgroundPrimary, COLORS.backgroundSecondary, COLORS.backgroundPrimary]} style={StyleSheet.absoluteFill} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: moodOverlay, opacity: isDark ? 0.13 : 0.18 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <Animated.View style={[styles.headerAbsolute, getEntranceStyle(entryBack, 15)]}>
          <TouchableOpacity onPress={handleExit} style={[styles.backBtn, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.backIcon, { color: COLORS.textPrimary }]}>{currentStep === 5 ? '✕' : '←'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.mainWrapper}>
          
          <View style={styles.greetingSlot}>
            {currentStep === 1 && (
              <Animated.View style={[styles.headerTitleContainer, getEntranceStyle(entryGreeting, 15), { opacity: Animated.multiply(entryGreeting, stepOpacity) }]}>
                <Text style={[styles.greetingText, { color: COLORS.textSecondary }]}>Hey, {nickname}.</Text>
                <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>How are you feeling?</Text>
              </Animated.View>
            )}
          </View>

          {currentStep !== 5 && (
            <Animated.View style={getEntranceStyle(entryFace, 25)}>
              <Animated.View style={[styles.faceContainerShared, { transform: [{ scale: faceScale }, { translateY: Animated.add(faceTranslateY, faceFloat) }] }]}>
                <View style={styles.eyesRow}>
                  <Animated.View style={{ transform: [{ scaleY: faceBlink }] }}>
                    <Animated.View style={[styles.eye, { height: 62, width: 62, borderRadius: 31, backgroundColor: COLORS.textPrimary, transform: [{ scaleX: eyeScaleX }, { scaleY: eyeScaleY }] }]} />
                  </Animated.View>
                  <Animated.View style={{ transform: [{ scaleY: faceBlink }] }}>
                    <Animated.View style={[styles.eye, { height: 62, width: 62, borderRadius: 31, backgroundColor: COLORS.textPrimary, transform: [{ scaleX: eyeScaleX }, { scaleY: eyeScaleY }] }]} />
                  </Animated.View>
                </View>
                <Animated.View style={[styles.mouth, { borderColor: COLORS.textPrimary, transform: [{ scaleY: mouthScale }] }]} />
              </Animated.View>
            </Animated.View>
          )}

          {currentStep < 5 && (
            <Animated.View style={[{ flex: 1, width: '100%' }, getEntranceStyle(entryContent, 25)]}>
              <Animated.View style={[styles.stepArea, { opacity: stepOpacity, transform: [{ translateX: stepTranslateX }] }]}>
                
                {currentStep === 1 && (
                  <View style={styles.stepContent}>
                    <View style={styles.textContainer}>
                      <Text style={[styles.massiveText, { color: isDark ? MOODS[currentMoodIndex].color : COLORS.textPrimary }]}>{MOODS[currentMoodIndex].label}</Text>
                    </View>

                    <View style={styles.sliderWrapper}>
                      <View style={[styles.trackContainer, { width: sliderWidth }]}>
                        <View style={[styles.sliderTrack, { backgroundColor: COLORS.border }]} />

                        {MOODS.map((mood, index) => {
                          const position = index * (sliderWidth / 4);
                          return (
                            <TouchableOpacity key={mood.label} style={[styles.trackDotHitbox, { left: position - 15 }]} onPress={() => moveSliderTo(position)}>
                              <View style={[styles.trackDot, { backgroundColor: mood.color }]} />
                            </TouchableOpacity>
                          );
                        })}

                        <Animated.View
                          {...panResponder.panHandlers}
                          style={[styles.sliderThumb, { backgroundColor: moodOverlay, borderColor: COLORS.backgroundSecondary, shadowColor: moodColor, transform: [{ translateX: sliderAnim }] }]}
                        />
                      </View>
                      
                      <View style={styles.sliderLabels}>
                        <Text style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>Not good</Text>
                        <Text style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>Very good</Text>
                      </View>
                    </View>
                  </View>
                )}

                {currentStep === 2 && (
                  <View style={styles.stepContentGrid}>
                    <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>What's making your day like this?</Text>
                    <Text style={[styles.stepSubtitle, { color: COLORS.accentElectricBlue }]}>SELECT UP TO 10 ACTIVITIES</Text>
                    {renderGrid(ACTIVITIES, selectedActivities, setSelectedActivities)}
                  </View>
                )}

                {currentStep === 3 && (
                  <View style={styles.stepContentGrid}>
                    <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>And how are you feeling about this?</Text>
                    <Text style={[styles.stepSubtitle, { color: COLORS.accentElectricBlue }]}>SELECT UP TO 10 FEELINGS</Text>
                    {renderGrid(FEELINGS, selectedFeelings, setSelectedFeelings)}
                  </View>
                )}

                {currentStep === 4 && (
                  <ScrollView style={styles.stepContentNotes} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
                    <Text style={[styles.stepTitle, { color: COLORS.textPrimary }]}>Anything you'd like to share?</Text>
                    <Text style={[styles.stepSubtitle, { color: COLORS.accentElectricBlue }]}>YOUR PRIVATE SPACE</Text>

                    <View style={styles.summaryChips}>
                      {[...selectedActivities, ...selectedFeelings].map(item => (
                        <View key={item} style={[styles.chip, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    <TextInput style={[styles.titleInput, { color: COLORS.textPrimary, borderBottomColor: COLORS.border }]} placeholder="Give your day a title..." placeholderTextColor={COLORS.textMuted} value={title} onChangeText={setTitle} selectionColor={COLORS.accentElectricBlue} />
                    <TextInput style={[styles.noteInput, { color: COLORS.textPrimary, backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} placeholder="Write whatever is on your mind..." placeholderTextColor={COLORS.textMuted} value={note} onChangeText={setNote} multiline textAlignVertical="top" selectionColor={COLORS.accentElectricBlue} />
                  </ScrollView>
                )}

              </Animated.View>
            </Animated.View>
          )}

          {currentStep < 5 && (
            <Animated.View style={[styles.bottomBar, getEntranceStyle(entryBottom, 25)]}>
              <TouchableOpacity activeOpacity={0.8} disabled={isSaving} style={[styles.continueBtnBig, { backgroundColor: COLORS.accentElectricBlue }]} onPress={currentStep === 4 ? saveCheckIn : nextStep}>
                <Text style={[styles.continueBtnBigText, { color: '#FFFFFF' }]}>{isSaving ? 'SAVING...' : currentStep === 4 ? 'COMPLETE CHECK-IN' : 'CONTINUE'}</Text>
                {!isSaving && <Text style={styles.buttonArrow}>→</Text>}
              </TouchableOpacity>
            </Animated.View>
          )}

          {currentStep === 5 && (
            <Animated.View style={[styles.thankYouAreaRef, { opacity: completionOpacity }]}>
              <Animated.Text style={[styles.thankYouTitleRef, { color: COLORS.textPrimary }, getBouncyStyle(completionTitleAnim, 30)]}>
                Thank you for your feedback!
              </Animated.Text>

              <Animated.Text style={[styles.thankYouSubtitleRef, { color: COLORS.textSecondary }, getBouncyStyle(completionSubAnim, 30)]}>
                We're saving your check-in. Explore your mood patterns or take a moment to breathe.
              </Animated.Text>

              <Animated.View style={[styles.thankYouActionsRef, getBouncyStyle(completionBtnAnims, 50)]}>
                <TouchableOpacity style={[styles.actionPillDarkRef, { backgroundColor: COLORS.accentElectricBlue }]} onPress={handleTrendNavigation}>
                  <Text style={styles.actionPillTextWhiteRef}>See Trend Chart</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionPillLightRef, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} onPress={handleBreatheNavigation}>
                  <Text style={[styles.actionPillTextWhiteRef, { color: COLORS.textPrimary }]}>Breathing Exercise</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showCounselorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>We're here for you 💙</Text>
            <Text style={[styles.modalText, { color: COLORS.textSecondary }]}>We noticed you've been feeling down over your past few check-ins. Engineering can be overwhelming, but you don't have to carry it alone. Consider reaching out to a campus counselor.</Text>
            <TouchableOpacity style={[styles.modalPrimaryBtn, { backgroundColor: COLORS.accentElectricBlue }]} onPress={() => { setShowCounselorModal(false); navigation.navigate('Breathe'); }}>
              <Text style={styles.modalPrimaryBtnText}>Do a Breathing Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDismissBtn} onPress={() => setShowCounselorModal(false)}>
              <Text style={[styles.modalDismissText, { color: COLORS.textMuted }]}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Increased top position slightly for clearing absolute notch / status bar safely
  headerAbsolute: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, left: 20, zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  backIcon: { fontSize: 22, fontWeight: '600' },
  
  // Heavily increased padding top to safely clear the absolute back button and push title into safe area
  mainWrapper: { flex: 1, paddingTop: Platform.OS === 'ios' ? 120 : 105 },
  greetingSlot: { minHeight: 70, justifyContent: 'center', paddingHorizontal: 20 },
  headerTitleContainer: { width: '100%', alignItems: 'center' },
  greetingText: { fontSize: 16, fontFamily: 'Manrope_600SemiBold', marginBottom: 6 },
  headerTitle: { fontSize: 28, fontFamily: 'Manrope_800ExtraBold', textAlign: 'center' },
  
  // Increased top margin to separate the face from the greeting title
  faceContainerShared: { alignItems: 'center', height: 128, justifyContent: 'center', zIndex: 2, marginTop: 15 },
  eyesRow: { flexDirection: 'row', gap: 32, alignItems: 'center', marginBottom: 16 },
  eye: {},
  mouth: { width: 72, height: 35, borderBottomWidth: 9, borderLeftWidth: 9, borderRightWidth: 9, borderBottomLeftRadius: 38, borderBottomRightRadius: 38 },
  
  stepArea: { flex: 1, width: '100%' },
  
  // Re-architected Step 1 content to perfectly center in the available space vertically between face and bottom bar
  stepContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  textContainer: { justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 35 },
  massiveText: { fontSize: 40, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 2 },
  sliderWrapper: { alignItems: 'center', height: 55, justifyContent: 'center', width: '100%' },
  trackContainer: { height: 44, justifyContent: 'center' },
  sliderTrack: { width: '100%', height: 4, borderRadius: 4, position: 'absolute' },
  trackDotHitbox: { position: 'absolute', top: 0, width: 30, height: 44, justifyContent: 'center', alignItems: 'center' },
  trackDot: { width: 9, height: 9, borderRadius: 5 },
  sliderThumb: { width: 36, height: 36, borderRadius: 18, position: 'absolute', left: -18, borderWidth: 3, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 9, elevation: 7 },
  sliderLabels: { width: SLIDER_WIDTH, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  
  stepContentGrid: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  stepTitle: { fontSize: 21, fontFamily: 'Manrope_700Bold', textAlign: 'center', marginBottom: 7 },
  stepSubtitle: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', textAlign: 'center', letterSpacing: 1.5, marginBottom: 15 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 120 },
  gridItemWrapper: { width: '30.5%', aspectRatio: 0.9, marginBottom: 15 },
  gridItem: { flex: 1, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  glassIconWrap: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1 },
  gridLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold' },
  selectedIndicator: { position: 'absolute', width: 6, height: 6, borderRadius: 3, top: 9, right: 9 },
  
  stepContentNotes: { flex: 1, paddingHorizontal: 25, paddingTop: 10 },
  summaryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 18 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.pill, borderWidth: 1 },
  titleInput: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold', marginBottom: 18, paddingVertical: 12, borderBottomWidth: 1 },
  noteInput: { fontSize: 15, fontFamily: 'Manrope_500Medium', minHeight: 150, padding: 16, borderRadius: 18, borderWidth: 1, lineHeight: 23 },
  
  bottomBar: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 25, width: '100%', paddingHorizontal: 25, alignItems: 'center' },
  continueBtnBig: { width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', ...SHADOWS.subtle },
  continueBtnBigText: { fontSize: 14, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1 },
  buttonArrow: { color: '#FFFFFF', fontSize: 19, position: 'absolute', right: 24 },
  
  thankYouAreaRef: { flex: 1, alignItems: 'center', paddingHorizontal: 35, justifyContent: 'flex-start', paddingTop: 60 },
  thankYouTitleRef: { fontSize: 26, fontFamily: 'Manrope_800ExtraBold', textAlign: 'center', marginBottom: 16, lineHeight: 34 },
  thankYouSubtitleRef: { fontSize: 14, textAlign: 'center', marginBottom: 45, lineHeight: 22, fontFamily: 'Manrope_500Medium', paddingHorizontal: 10 },
  thankYouActionsRef: { width: '100%', gap: 16, position: 'absolute', bottom: 50, paddingHorizontal: 20 },
  actionPillDarkRef: { width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, alignItems: 'center', ...SHADOWS.subtle },
  actionPillLightRef: { width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, alignItems: 'center', borderWidth: 1 },
  actionPillTextWhiteRef: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Manrope_700Bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalContent: { width: '100%', padding: 25, borderRadius: 24, borderWidth: 1, alignItems: 'center', ...SHADOWS.subtle },
  modalTitle: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold', marginBottom: 12, textAlign: 'center' },
  modalText: { fontSize: 14, fontFamily: 'Manrope_500Medium', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalPrimaryBtn: { width: '100%', paddingVertical: 16, borderRadius: RADIUS.pill, alignItems: 'center', marginBottom: 12 },
  modalPrimaryBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Manrope_700Bold' },
  modalDismissBtn: { padding: 8 },
  modalDismissText: { fontSize: 13, fontFamily: 'Manrope_600SemiBold' },
});