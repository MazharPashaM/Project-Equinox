import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';

import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  ZoomIn,
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';

import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme, RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

const FRAME_SIZE = Math.min(width * 0.72, 300);
const FACE_SIZE = FRAME_SIZE * 0.61;
const FRAME_RADIUS = 35;
const STROKE_WIDTH = 8;
const OFFSET = STROKE_WIDTH / 2;
const ACTUAL_SIZE = FRAME_SIZE - STROKE_WIDTH;

const PHASE_DURATION = 8000;
const SESSION_OPTIONS = [32, 64];

type BreathPhase = 'Inhale' | 'Hold' | 'Exhale';
const PHASES: BreathPhase[] = ['Inhale', 'Hold', 'Exhale', 'Hold'];

// Mathematically perfect edge-to-edge rounded rectangle path
const FRAME_PATH = `
  M ${OFFSET + FRAME_RADIUS} ${OFFSET}
  H ${OFFSET + ACTUAL_SIZE - FRAME_RADIUS}
  A ${FRAME_RADIUS} ${FRAME_RADIUS} 0 0 1 ${OFFSET + ACTUAL_SIZE} ${OFFSET + FRAME_RADIUS}
  V ${OFFSET + ACTUAL_SIZE - FRAME_RADIUS}
  A ${FRAME_RADIUS} ${FRAME_RADIUS} 0 0 1 ${OFFSET + ACTUAL_SIZE - FRAME_RADIUS} ${OFFSET + ACTUAL_SIZE}
  H ${OFFSET + FRAME_RADIUS}
  A ${FRAME_RADIUS} ${FRAME_RADIUS} 0 0 1 ${OFFSET} ${OFFSET + ACTUAL_SIZE - FRAME_RADIUS}
  V ${OFFSET + FRAME_RADIUS}
  A ${FRAME_RADIUS} ${FRAME_RADIUS} 0 0 1 ${OFFSET + FRAME_RADIUS} ${OFFSET}
  Z
`;

const STRAIGHT_LENGTH = ACTUAL_SIZE - 2 * FRAME_RADIUS;
const PATH_LENGTH = 4 * STRAIGHT_LENGTH + 2 * Math.PI * FRAME_RADIUS;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function BreatheScreen({ navigation }: any) {
  const { COLORS, isDark } = useTheme();

  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const sessionStartedAt = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values
  const faceScale = useSharedValue(1);
  const faceFloat = useSharedValue(0);
  const progress = useSharedValue(0);
  const phaseIndexValue = useSharedValue(0);
  const shadowScale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.35);

  const durationMs = (selectedDuration ?? 32) * 1000;
  const currentPhaseIndex = Math.floor(elapsedMs / PHASE_DURATION) % 4;
  const remainingSeconds = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));

  // -----------------------------------------------
  // TIMER CLEANUP
  // -----------------------------------------------
  const clearIntervalTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // -----------------------------------------------
  // ANIMATION RESET
  // -----------------------------------------------
  const resetAnimations = () => {
    cancelAnimation(faceScale);
    cancelAnimation(faceFloat);
    cancelAnimation(progress);
    cancelAnimation(shadowScale);
    cancelAnimation(shadowOpacity);

    faceScale.value = 1;
    faceFloat.value = 0;
    progress.value = 0;
    phaseIndexValue.value = 0;
    shadowScale.value = 1;
    shadowOpacity.value = 0.35;
  };

  // -----------------------------------------------
  // SESSION TIMER
  // -----------------------------------------------
  useEffect(() => {
    if (!isActive || isCompleted || !selectedDuration) {
      clearIntervalTimer();
      return;
    }

    sessionStartedAt.current = Date.now() - elapsedMs;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.min(Date.now() - sessionStartedAt.current, durationMs);
      setElapsedMs(elapsed);

      if (elapsed >= durationMs) {
        clearIntervalTimer();
        setIsActive(false);
        setIsCompleted(true);
      }
    }, 40);

    return () => clearIntervalTimer();
  }, [isActive, isCompleted, selectedDuration]);

  // -----------------------------------------------
  // BREATHING ANIMATION
  // -----------------------------------------------
  useEffect(() => {
    if (!isActive || isCompleted) {
      cancelAnimation(progress);
      cancelAnimation(faceScale);
      cancelAnimation(faceFloat);
      return;
    }

    const index = currentPhaseIndex;
    const phaseOffset = elapsedMs % PHASE_DURATION;
    const remaining = PHASE_DURATION - phaseOffset;

    phaseIndexValue.value = index;
    progress.value = phaseOffset / PHASE_DURATION;

    progress.value = withTiming(1, { duration: remaining, easing: Easing.linear });

    // Premium, subtle magnitude updates
    if (index === 0) {
      // INHALE
      faceScale.value = withTiming(1.08, { duration: remaining, easing: Easing.inOut(Easing.ease) });
      faceFloat.value = withTiming(-2.5, { duration: remaining, easing: Easing.inOut(Easing.ease) });
      shadowScale.value = withTiming(0.85, { duration: remaining, easing: Easing.inOut(Easing.ease) });
      shadowOpacity.value = withTiming(0.2, { duration: remaining });
    } else if (index === 1) {
      // HOLD 1
      faceScale.value = withTiming(1.08, { duration: remaining, easing: Easing.linear });
      faceFloat.value = withTiming(-2.5, { duration: remaining });
    } else if (index === 2) {
      // EXHALE
      faceScale.value = withTiming(0.92, { duration: remaining, easing: Easing.inOut(Easing.ease) });
      faceFloat.value = withTiming(0, { duration: remaining, easing: Easing.inOut(Easing.ease) });
      shadowScale.value = withTiming(1, { duration: remaining, easing: Easing.inOut(Easing.ease) });
      shadowOpacity.value = withTiming(0.35, { duration: remaining });
    } else {
      // HOLD 2
      faceScale.value = withTiming(0.92, { duration: remaining, easing: Easing.linear });
      faceFloat.value = withTiming(0, { duration: remaining });
    }
  }, [isActive, isCompleted, currentPhaseIndex]);

  // -----------------------------------------------
  // ANIMATED STYLES
  // -----------------------------------------------
  const faceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: faceScale.value }, { translateY: faceFloat.value }],
  }));

  const progressAnimatedProps = useAnimatedProps(() => {
    const totalProgress = (phaseIndexValue.value + progress.value) / 4;
    return {
      strokeDashoffset: PATH_LENGTH * (1 - totalProgress),
    };
  });

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: shadowScale.value }],
    opacity: shadowOpacity.value,
  }));

  // -----------------------------------------------
  // SESSION CONTROLS
  // -----------------------------------------------
  const handleStart = (seconds: number) => {
    clearIntervalTimer();
    resetAnimations();
    setSelectedDuration(seconds);
    setElapsedMs(0);
    setIsCompleted(false);
    setIsActive(true);
  };

  const handlePauseResume = () => {
    if (isActive) {
      const elapsed = Math.min(Date.now() - sessionStartedAt.current, durationMs);
      setElapsedMs(elapsed);
      setIsActive(false);
    } else if (elapsedMs < durationMs) {
      setIsActive(true);
    }
  };

  const handleRestart = () => {
    if (!selectedDuration) return;
    clearIntervalTimer();
    resetAnimations();
    setElapsedMs(0);
    setIsCompleted(false);
    setIsActive(true);
  };

  const handleExit = () => {
    clearIntervalTimer();
    setIsActive(false);
    navigation.goBack();
  };

  const handleBackToSelection = () => {
    clearIntervalTimer();
    setIsActive(false);
    setIsCompleted(false);
    setSelectedDuration(null);
    setElapsedMs(0);
    resetAnimations();
  };

  // -----------------------------------------------
  // DISPLAY HELPERS
  // -----------------------------------------------
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  };

  const phaseTitle = currentPhaseIndex === 0 ? 'Breathe in' : currentPhaseIndex === 1 ? 'Hold' : currentPhaseIndex === 2 ? 'Breathe out' : 'Hold';
  const phaseSubtitle = currentPhaseIndex === 0 ? 'Breathe in slowly through your nose' : currentPhaseIndex === 1 ? 'Keep your breath steady' : currentPhaseIndex === 2 ? 'Release slowly through your mouth' : 'Rest and prepare for the next breath';
  const mouthPath = (currentPhaseIndex === 1 || currentPhaseIndex === 3) ? 'M 85 116 Q 100 118 115 116' : currentPhaseIndex === 2 ? 'M 72 112 Q 100 140 128 112' : 'M 77 112 Q 100 130 123 112';

  // -----------------------------------------------
  // UI
  // -----------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: COLORS.backgroundPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.15)' : 'rgba(8, 126, 245, 0.15)' }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} activeOpacity={0.75} style={[styles.backBtn, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
          <Feather name="x" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ========================================= */}
      {/* DURATION SELECTION */}
      {/* ========================================= */}
      {!selectedDuration && (
        <Animated.View key="selection" entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} exiting={FadeOutUp.duration(300)} style={styles.selectionScreen}>
          <Animated.View entering={FadeIn.delay(100).duration(550)} style={styles.selectionHeading}>
            <Text style={[styles.selectionEyebrow, { color: COLORS.accentCyan }]}>EQUINOX MINDFULNESS</Text>
            <Text style={[styles.selectionTitle, { color: COLORS.textPrimary }]}>Find your rhythm</Text>
            <Text style={[styles.selectionSubtitle, { color: COLORS.textSecondary }]}>Choose how long you'd like to breathe. Take this moment just for yourself.</Text>
          </Animated.View>

          <View style={styles.durationOptions}>
            {SESSION_OPTIONS.map((seconds, index) => (
              <Animated.View key={seconds} entering={FadeInDown.delay(180 + index * 120).duration(500).easing(Easing.out(Easing.cubic))} style={styles.durationCardWrapper}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => handleStart(seconds)} style={[styles.durationCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
                  <Text style={[styles.durationNumber, { color: COLORS.accentAmber }]}>{seconds}</Text>
                  <Text style={[styles.durationUnit, { color: COLORS.textPrimary }]}>SECONDS</Text>
                  <View style={[styles.goldDivider, { backgroundColor: COLORS.border }]} />
                  <Text style={[styles.durationDescription, { color: COLORS.textSecondary }]}>{seconds === 32 ? 'One full cycle' : 'Two full cycles'}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <Animated.Text entering={FadeIn.delay(500).duration(600)} style={[styles.selectionFooter, { color: COLORS.textMuted }]}>
            Inhale · Hold · Exhale · Hold
          </Animated.Text>
        </Animated.View>
      )}

      {/* ========================================= */}
      {/* ACTIVE BREATHING SESSION */}
      {/* ========================================= */}
      {selectedDuration && !isCompleted && (
        <Animated.View key="active-session" entering={FadeIn.duration(450)} exiting={FadeOut.duration(300)} style={styles.mainWrapper}>
          
          <View style={styles.titleContainer}>
            <Animated.Text key={`${currentPhaseIndex}-${isActive}`} entering={FadeInDown.duration(350)} exiting={FadeOutUp.duration(180)} style={[styles.phaseTitle, { color: COLORS.textPrimary }]}>
              {isActive ? phaseTitle : 'Session paused'}
            </Animated.Text>
            <Animated.Text key={`subtitle-${currentPhaseIndex}-${isActive}`} entering={FadeIn.duration(450)} exiting={FadeOut.duration(150)} style={[styles.phaseSubtitle, { color: COLORS.textSecondary }]}>
              {isActive ? phaseSubtitle : 'Take your time. Resume when ready.'}
            </Animated.Text>
          </View>

          <View style={styles.animationArea}>
            <Svg width={FRAME_SIZE} height={FRAME_SIZE} viewBox={`0 0 ${FRAME_SIZE} ${FRAME_SIZE}`} style={styles.progressSvg}>
              <Defs>
                <SvgLinearGradient id="equinoxProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={COLORS.accentElectricBlue} />
                  <Stop offset="50%" stopColor={COLORS.accentCyan} />
                  <Stop offset="100%" stopColor={COLORS.accentAmber} />
                </SvgLinearGradient>
              </Defs>
              <Path d={FRAME_PATH} fill="none" stroke={COLORS.surfaceElevated} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
              <AnimatedPath d={FRAME_PATH} fill="none" stroke="url(#equinoxProgress)" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`} animatedProps={progressAnimatedProps} />
            </Svg>

            <Animated.View style={[styles.faceWrapper, faceAnimatedStyle, { shadowColor: COLORS.accentCyan }, SHADOWS.glowCyan]}>
              <LinearGradient colors={['#A3F0FA', COLORS.accentCyan, COLORS.accentElectricBlue]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.faceGradient}>
                <View style={[styles.faceShade, { backgroundColor: 'rgba(30,31,110,0.19)' }]} />
                <Svg width={FACE_SIZE} height={FACE_SIZE} viewBox="0 0 200 200" style={styles.faceSvg}>
                  <Path d="M 65 83 Q 78 99 91 83" stroke="#183A79" strokeWidth={5} strokeLinecap="round" fill="none" />
                  <Path d="M 109 83 Q 122 99 135 83" stroke="#183A79" strokeWidth={5} strokeLinecap="round" fill="none" />
                  <Path d={mouthPath} stroke="#183A79" strokeWidth={5} strokeLinecap="round" fill="none" />
                </Svg>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.groundShadow, { backgroundColor: isDark ? '#020817' : '#8095C0' }, shadowAnimatedStyle]} />
          </View>

          <View style={styles.bottomBar}>
            <Text style={[styles.timer, { color: COLORS.textPrimary }]}>
              {formatTime(remainingSeconds)}
            </Text>
            
            <TouchableOpacity activeOpacity={0.85} onPress={handlePauseResume} style={[styles.controlBtn, { backgroundColor: isActive ? COLORS.surfaceCard : COLORS.textPrimary, borderColor: isActive ? COLORS.border : 'transparent', borderWidth: isActive ? 1 : 0 }]}>
              <Text style={[styles.controlBtnText, { color: isActive ? COLORS.textPrimary : COLORS.backgroundPrimary }]}>
                {isActive ? 'PAUSE SESSION' : 'RESUME SESSION'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBackToSelection} style={styles.secondaryBtn}>
              <Text style={[styles.secondaryBtnText, { color: COLORS.textMuted }]}>END SESSION</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ========================================= */}
      {/* SESSION COMPLETED */}
      {/* ========================================= */}
      {selectedDuration && isCompleted && (
        <Animated.View key="completed" entering={FadeIn.duration(500)} style={styles.completionScreen}>
          <Animated.View entering={ZoomIn.delay(150).duration(500).easing(Easing.out(Easing.cubic))} style={[styles.completionIcon, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border, shadowColor: COLORS.accentAmber }]}>
            <Feather name="star" size={38} color={COLORS.accentAmber} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(250).duration(500).easing(Easing.out(Easing.cubic))} style={[styles.completionTitle, { color: COLORS.textPrimary }]}>Session completed</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).duration(500).easing(Easing.out(Easing.cubic))} style={[styles.completionSubtitle, { color: COLORS.textSecondary }]}>Well done. You took a moment to slow down and focus on yourself.</Animated.Text>

          <Animated.View entering={FadeInDown.delay(400).duration(500).easing(Easing.out(Easing.cubic))} style={[styles.durationSummary, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.summaryValue, { color: COLORS.accentAmber }]}>{selectedDuration}s</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>TIME COMPLETED</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(500).easing(Easing.out(Easing.cubic))} style={styles.completionActions}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleRestart} style={[styles.actionPillDarkRef, { backgroundColor: COLORS.accentElectricBlue }]}>
              <Text style={styles.actionPillTextWhiteRef}>START AGAIN</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={handleExit} style={[styles.actionPillLightRef, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
              <Text style={[styles.actionPillTextWhiteRef, { color: COLORS.textPrimary }]}>BACK TO EQUINOX</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  ambientGlow: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, filter: 'blur(40px)', opacity: 0.8, zIndex: 0 },
  header: { position: 'absolute', top: Platform.OS === 'ios' ? 55 : 42, left: 20, zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  selectionScreen: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  selectionHeading: { alignItems: 'center', marginBottom: 45 },
  selectionEyebrow: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 2, marginBottom: 15 },
  selectionTitle: { fontSize: 32, fontFamily: 'Manrope_800ExtraBold', textAlign: 'center', marginBottom: 12 },
  selectionSubtitle: { fontSize: 15, fontFamily: 'Manrope_500Medium', textAlign: 'center', lineHeight: 23, maxWidth: 300 },
  durationOptions: { flexDirection: 'row', gap: 14 },
  durationCardWrapper: { flex: 1 },
  durationCard: { borderRadius: RADIUS.lg, borderWidth: 1, paddingVertical: 28, alignItems: 'center', ...SHADOWS.subtle },
  durationNumber: { fontSize: 43, fontFamily: 'Manrope_800ExtraBold' },
  durationUnit: { fontSize: 11, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1.5, marginTop: 2 },
  goldDivider: { width: 35, height: 3, borderRadius: 3, marginTop: 13 },
  durationDescription: { fontSize: 11, fontFamily: 'Manrope_500Medium', marginTop: 12, textAlign: 'center' },
  selectionFooter: { textAlign: 'center', marginTop: 35, fontSize: 11, fontFamily: 'Manrope_500Medium', letterSpacing: 0.3 },

  mainWrapper: { flex: 1, justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 125 : 105, paddingBottom: Platform.OS === 'ios' ? 35 : 22 },
  titleContainer: { alignItems: 'center', paddingHorizontal: 25, height: 85 },
  phaseTitle: { fontSize: 32, fontFamily: 'Manrope_800ExtraBold', marginBottom: 9 },
  phaseSubtitle: { fontSize: 14, fontFamily: 'Manrope_500Medium', textAlign: 'center' },
  animationArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressSvg: { position: 'absolute' },

  faceWrapper: { width: FACE_SIZE, height: FACE_SIZE, borderRadius: FACE_SIZE / 2, overflow: 'hidden', elevation: 16, shadowOpacity: 0.32, shadowRadius: 28, shadowOffset: { width: 0, height: 12 } },
  faceGradient: { flex: 1, borderRadius: FACE_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
  faceShade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '34%', borderBottomLeftRadius: FACE_SIZE / 2, borderBottomRightRadius: FACE_SIZE / 2 },
  faceSvg: { position: 'absolute', width: '100%', height: '100%' },
  groundShadow: { position: 'absolute', bottom: FRAME_SIZE * 0.03, width: FACE_SIZE * 0.65, height: 15, borderRadius: 50, zIndex: -1 },

  bottomBar: { paddingHorizontal: 30, alignItems: 'center' },
  timer: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold', marginBottom: 18, letterSpacing: 1 },
  controlBtn: { width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center', ...SHADOWS.subtle },
  controlBtnText: { fontSize: 14, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1.3 },
  secondaryBtn: { marginTop: 20, padding: 10, alignItems: 'center' },
  secondaryBtnText: { fontSize: 12, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1.2 },

  completionScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  completionIcon: { width: 92, height: 92, borderRadius: 46, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 30, shadowOpacity: 0.25, shadowRadius: 25, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  completionTitle: { fontSize: 29, fontFamily: 'Manrope_800ExtraBold', textAlign: 'center', marginBottom: 12 },
  completionSubtitle: { fontSize: 14, fontFamily: 'Manrope_500Medium', textAlign: 'center', lineHeight: 23, maxWidth: 290 },
  durationSummary: { width: 155, paddingVertical: 20, borderRadius: 22, borderWidth: 1, alignItems: 'center', marginTop: 35, marginBottom: 35 },
  summaryValue: { fontSize: 35, fontFamily: 'Manrope_800ExtraBold' },
  summaryLabel: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1.2, marginTop: 5 },
  completionActions: { width: '100%', gap: 16, alignItems: 'center' },

  actionPillDarkRef: { width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, alignItems: 'center', ...SHADOWS.subtle },
  actionPillLightRef: { width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, alignItems: 'center', borderWidth: 1 },
  actionPillTextWhiteRef: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1 },
});