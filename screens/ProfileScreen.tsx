import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated, Dimensions, Modal, Linking, Alert, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import { RADIUS, SHADOWS, useTheme } from '../theme';
import { globalNavDirection } from '../components/CustomTabBar';

const { width } = Dimensions.get('window');

// Reusable Glass Icon Component
const GlassIcon = ({ name, color, size = 20, isDarkTheme, isSolid = false }: { name: any, color: string, size?: number, isDarkTheme: boolean, isSolid?: boolean }) => (
  <View style={[styles.glassIconContainer, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
    {isSolid ? <Ionicons name={name} size={size} color={color} /> : <Feather name={name} size={size} color={color} />}
  </View>
);

export default function ProfileScreen({ navigation }: any) {
  const { COLORS, isDark, toggleTheme } = useTheme();

  const [nickname, setNickname] = useState('Explorer');
  const [stats, setStats] = useState({ checkins: 0, reflections: 0, positive: 0 });
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  
  const [showRestartWarning, setShowRestartWarning] = useState(false);
  const [showEraseWarning, setShowEraseWarning] = useState(false);
  const [showSampleWarning, setShowSampleWarning] = useState(false);
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  
  const animBg = useRef(new Animated.Value(0)).current;
  const animHeader = useRef(new Animated.Value(0)).current;
  const animIdCard = useRef(new Animated.Value(0)).current;
  const animStats = useRef(new Animated.Value(0)).current;
  const animToolkit = useRef(new Animated.Value(0)).current;
  const animSettings = useRef(new Animated.Value(0)).current;
  const animErase = useRef(new Animated.Value(0)).current;
  const emergencyAnim = useRef(new Animated.Value(0)).current;
  const themeSwitchAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useFocusEffect(
    useCallback(() => {
      const startX = globalNavDirection === 'right' ? width * 0.15 : -width * 0.15;
      
      [animHeader, animIdCard, animStats, animToolkit, animSettings, animErase].forEach(a => a.setValue(0));
      animBg.setValue(startX);
      loadData();

      Animated.parallel([
        Animated.spring(animBg, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.stagger(50, [
          Animated.spring(animHeader, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.spring(animIdCard, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.spring(animStats, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.spring(animToolkit, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.spring(animSettings, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.spring(animErase, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
        ])
      ]).start();
      
      return () => { setEmergencyVisible(false); setIsEditing(false); setShowRestartWarning(false); setShowEraseWarning(false); setShowSampleWarning(false); };
    }, [])
  );

  const loadData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('equinox_nickname');
      if (savedName) { setNickname(savedName); setTempName(savedName); }
      const existingData = await AsyncStorage.getItem('equinox_checkins');
      if (existingData) {
        const records = JSON.parse(existingData);
        setStats({
          checkins: records.length,
          reflections: records.filter((r: any) => r.note && r.note.trim().length > 0).length,
          positive: records.filter((r: any) => r.mood >= 4 || r.type === 'photo').length
        });
      } else {
        setStats({ checkins: 0, reflections: 0, positive: 0 });
      }
    } catch (error) { console.error(error); }
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await AsyncStorage.setItem('equinox_nickname', tempName);
      setNickname(tempName);
      setIsEditing(false);
    }
  };

  const handleThemeToggle = (e: any) => {
    const { pageX, pageY } = e.nativeEvent;
    toggleTheme(pageX, pageY);
    Animated.sequence([
      Animated.timing(themeSwitchAnim, { toValue: isDark ? 0.5 : 0.5, duration: 150, useNativeDriver: true }),
      Animated.timing(themeSwitchAnim, { toValue: isDark ? 0 : 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const handleNotifs = () => {
    const next = !notifsEnabled;
    setNotifsEnabled(next);
    Alert.alert("Notifications", next ? "Wellbeing reminders are now enabled." : "Notifications have been muted.");
  };

  const openEmergency = () => {
    setEmergencyVisible(true);
    Animated.spring(emergencyAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
  };

  const closeEmergency = () => {
    Animated.timing(emergencyAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setEmergencyVisible(false));
  };

  const handleEraseData = async () => {
    await AsyncStorage.clear();
    setShowEraseWarning(false);
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  // Feature: Load Test Data for Analytics Graph Testing
  const handleLoadSampleData = async () => {
    try {
      const sampleCheckins = [];
      const today = new Date();
      
      // Generate 15 fake check-ins across the last 15 days to test the graph properly
      for (let i = 14; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(18, 30, 0, 0); // 6:30 PM

        sampleCheckins.push({
          nickname,
          mood: Math.floor(Math.random() * 5) + 1, // Random mood 1-5
          activities: ['school', 'exercise'],
          feelings: ['good', 'anxious'],
          title: `Sample Day ${15 - i}`,
          note: 'This is a sample reflection generated for testing the trend graph.',
          date: d.toISOString(),
          type: 'mood'
        });
      }

      await AsyncStorage.setItem('equinox_checkins', JSON.stringify(sampleCheckins));
      setShowSampleWarning(false);
      loadData(); // Instantly update stats
      Alert.alert("Success", "Sample data loaded successfully. Check out the Insights tab to view the graph!");
    } catch (e) {
      console.error("Error loading sample data", e);
    }
  };

  const getSlideStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
  });

  const switchRotate = themeSwitchAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const switchScale = themeSwitchAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.6, 1] });

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.15)' : 'rgba(8, 126, 245, 0.15)' }]} />

      <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ transform: [{ translateX: animBg }] }}>
        
        <Animated.View style={[styles.headerContainer, getSlideStyle(animHeader)]}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.title, { color: COLORS.textPrimary }]}>Profile</Text>
          </View>
          <TouchableOpacity onPress={handleThemeToggle} style={[styles.smallAvatar, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} activeOpacity={1}>
             <Animated.View style={{ transform: [{ rotate: switchRotate }, { scale: switchScale }] }}>
                <Feather name={isDark ? "moon" : "sun"} size={20} color={COLORS.accentAmber} />
             </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.idCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }, getSlideStyle(animIdCard)]}>
          <View style={styles.idCardLeft}>
            <View style={[styles.idAvatarWrapper, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]}>
              <Text style={[styles.idAvatarInitials, { color: COLORS.accentElectricBlue }]}>{nickname.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={[styles.idName, { color: COLORS.textPrimary }]}>{nickname}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: COLORS.surfaceElevated }]} onPress={() => setIsEditing(true)}>
             <Feather name="edit-2" size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, getSlideStyle(animStats)]}>
          <View style={[styles.statsRow, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: COLORS.textPrimary }]}>{stats.checkins}</Text>
              <Text style={[styles.statLabel, { color: COLORS.accentCyan }]}>Check-ins</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: COLORS.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: COLORS.textPrimary }]}>{stats.reflections}</Text>
              <Text style={[styles.statLabel, { color: COLORS.accentCyan }]}>Reflections</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: COLORS.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: COLORS.textPrimary }]}>{stats.positive}</Text>
              <Text style={[styles.statLabel, { color: COLORS.accentAmber }]}>Positive</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, getSlideStyle(animToolkit)]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Your Wellbeing Toolkit</Text>
          
          <TouchableOpacity style={[styles.toolkitCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} onPress={() => navigation.navigate('Breathe')} activeOpacity={0.8}>
             <GlassIcon name="wind" color={COLORS.accentCyan} size={22} isDarkTheme={isDark} />
             <View style={styles.toolkitTextCol}>
                <Text style={[styles.toolkitTitle, { color: COLORS.textPrimary }]}>Breathing Exercises</Text>
                <Text style={[styles.toolkitDesc, { color: COLORS.textSecondary }]}>Take a moment. Slow down. Find your balance.</Text>
             </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolkitCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]} onPress={openEmergency} activeOpacity={0.8}>
             <GlassIcon name="phone" color={COLORS.accentAmber} size={22} isDarkTheme={isDark} />
             <View style={styles.toolkitTextCol}>
                <Text style={[styles.toolkitTitle, { color: COLORS.textPrimary }]}>Emergency Contacts</Text>
                <Text style={[styles.toolkitDesc, { color: COLORS.textSecondary }]}>Your trusted support, always within reach.</Text>
             </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, getSlideStyle(animSettings)]}>
          <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Personal Settings</Text>
          <View style={[styles.settingsGroup, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
             
             <TouchableOpacity style={[styles.settingRowGrouped, { borderBottomColor: COLORS.backgroundPrimary }]} onPress={handleNotifs}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: COLORS.textPrimary }]}>Notifications</Text>
                  <Text style={[styles.settingDesc, { color: COLORS.textSecondary }]}>Manage your wellbeing reminders.</Text>
                </View>
                <Text style={[styles.chevronText, { color: notifsEnabled ? COLORS.accentElectricBlue : COLORS.textMuted }]}>{notifsEnabled ? 'On' : 'Off'}</Text>
             </TouchableOpacity>

             <View style={[styles.settingRowGrouped, { borderBottomColor: COLORS.backgroundPrimary }]}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: COLORS.textPrimary }]}>Privacy & Data</Text>
                  <Text style={[styles.settingDesc, { color: COLORS.textSecondary }]}>Your personal space stays personal.</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
             </View>
             
             <TouchableOpacity style={[styles.settingRowGrouped, { borderBottomWidth: 0 }]} onPress={() => setShowRestartWarning(true)}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingTitle, { color: COLORS.textPrimary }]}>Restart Onboarding Setup</Text>
                  <Text style={[styles.settingDesc, { color: COLORS.textSecondary }]}>Want to personalise Equinox again? Start fresh.</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
             </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Development / Testing Tools section appended securely at the bottom */}
        <Animated.View style={[styles.eraseBtnContainer, getSlideStyle(animErase)]}>
          <TouchableOpacity onPress={() => setShowSampleWarning(true)} style={{ marginBottom: 20 }}>
            <Text style={[styles.eraseText, { color: COLORS.accentElectricBlue, textDecorationLine: 'none' }]}>+ Load Sample Analytics Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowEraseWarning(true)}>
            <Text style={styles.eraseText}>Erase all app data</Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.ScrollView>

      {/* Editing Modal */}
      <Modal visible={isEditing} transparent animationType="fade">
        <View style={styles.modalOverlayBase}>
          <View style={[styles.modalBox, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Edit Profile Name</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: COLORS.backgroundPrimary, color: COLORS.textPrimary, borderColor: COLORS.border }]} value={tempName} onChangeText={setTempName} autoFocus selectionColor={COLORS.accentElectricBlue} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtnCancel, { borderColor: COLORS.border }]} onPress={() => setIsEditing(false)}>
                <Text style={[styles.modalBtnCancelText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: COLORS.accentElectricBlue }]} onPress={handleSaveName}>
                <Text style={[styles.modalBtnSaveText, { color: '#FFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Restart Onboarding Modal */}
      <Modal visible={showRestartWarning} transparent animationType="fade">
        <View style={styles.modalOverlayBase}>
          <View style={[styles.modalBox, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Restart Setup?</Text>
            <Text style={[styles.modalDesc, { color: COLORS.textSecondary }]}>This will reset your onboarding preferences. Your saved mood history and reflections will NOT be deleted.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtnCancel, { borderColor: COLORS.border }]} onPress={() => setShowRestartWarning(false)}>
                <Text style={[styles.modalBtnCancelText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: COLORS.accentElectricBlue }]} onPress={() => { setShowRestartWarning(false); navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] }); }}>
                <Text style={[styles.modalBtnSaveText, { color: '#FFF' }]}>Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Sample Data Load Modal */}
      <Modal visible={showSampleWarning} transparent animationType="fade">
        <View style={styles.modalOverlayBase}>
          <View style={[styles.modalBox, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Load Sample Data?</Text>
            <Text style={[styles.modalDesc, { color: COLORS.textSecondary }]}>This tool generates 15 fake check-in records spanning the last 14 days. It is purely designed to help you test and visualize the Analytics Graph in the Insights tab. This will wipe your existing data to ensure a clean test.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtnCancel, { borderColor: COLORS.border }]} onPress={() => setShowSampleWarning(false)}>
                <Text style={[styles.modalBtnCancelText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: COLORS.accentElectricBlue }]} onPress={handleLoadSampleData}>
                <Text style={[styles.modalBtnSaveText, { color: '#FFF' }]}>Load Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Erase Warning Modal */}
      <Modal visible={showEraseWarning} transparent animationType="fade">
        <View style={styles.modalOverlayBase}>
          <View style={[styles.modalBox, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.statusDanger }]}>Erase All Data?</Text>
            <Text style={[styles.modalDesc, { color: COLORS.textSecondary }]}>Are you sure you want to permanently delete ALL app data? This includes your profile, onboarding setup, and all check-in history. This cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtnCancel, { borderColor: COLORS.border }]} onPress={() => setShowEraseWarning(false)}>
                <Text style={[styles.modalBtnCancelText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: 'rgba(255, 116, 125, 0.15)', borderWidth: 1, borderColor: COLORS.statusDanger }]} onPress={handleEraseData}>
                <Text style={[styles.modalBtnSaveText, { color: COLORS.statusDanger }]}>Erase Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Emergency Contacts Bottom Sheet / Overlay */}
      {emergencyVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
           <Animated.View style={[styles.modalOverlayBase, { opacity: emergencyAnim }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeEmergency} />
              <Animated.View style={[styles.modalBox, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border, transform: [{ scale: emergencyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
                <View style={styles.modalHeaderRow}>
                  <Text style={[styles.modalTitle, { color: COLORS.statusDanger, marginBottom: 0 }]}>Emergency Contacts</Text>
                  <TouchableOpacity onPress={closeEmergency}><Feather name="x" size={22} color={COLORS.textMuted} /></TouchableOpacity>
                </View>
                <Text style={[styles.modalDesc, { color: COLORS.textSecondary, marginBottom: 20 }]}>Your trusted support, always within reach.</Text>

                <TouchableOpacity style={[styles.helpCard, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]} onPress={() => Linking.openURL('tel:18005990019')}>
                  <View style={styles.helpTextCol}>
                    <Text style={[styles.helpTitle, { color: COLORS.textPrimary }]}>Kiran Mental Health</Text>
                    <Text style={[styles.helpDesc, { color: COLORS.textSecondary }]}>24/7 Toll-Free Support</Text>
                  </View>
                  <View style={[styles.callBtn, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}><Feather name="phone-call" size={16} color={COLORS.statusDanger} /></View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.helpCard, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]} onPress={() => Linking.openURL('tel:112')}>
                  <View style={styles.helpTextCol}>
                    <Text style={[styles.helpTitle, { color: COLORS.textPrimary }]}>National Emergency</Text>
                    <Text style={[styles.helpDesc, { color: COLORS.textSecondary }]}>Police & Medical (112)</Text>
                  </View>
                  <View style={[styles.callBtn, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}><Feather name="alert-triangle" size={16} color={COLORS.statusDanger} /></View>
                </TouchableOpacity>
              </Animated.View>
           </Animated.View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 120 },
  ambientGlow: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, filter: 'blur(40px)', opacity: 0.8 },
  
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTextCol: { flex: 1, paddingRight: 20 },
  title: { fontSize: 36, fontFamily: 'Manrope_800ExtraBold', marginBottom: 4 },
  smallAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  idCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 35, ...SHADOWS.subtle },
  idCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  idAvatarWrapper: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  idAvatarInitials: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold' },
  idName: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold' },
  editBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  
  section: { marginBottom: 35 },
  sectionTitle: { fontSize: 18, fontFamily: 'Manrope_800ExtraBold', marginBottom: 15 },
  
  statsRow: { flexDirection: 'row', borderRadius: RADIUS.lg, paddingVertical: 20, borderWidth: 1, ...SHADOWS.subtle },
  statCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, height: '60%', alignSelf: 'center' },
  statNum: { fontSize: 28, fontFamily: 'Manrope_800ExtraBold', marginBottom: 2 },
  statLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold' },
  
  toolkitCard: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: 18, marginBottom: 15, alignItems: 'center', borderWidth: 1, ...SHADOWS.subtle },
  glassIconContainer: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1 },
  toolkitTextCol: { flex: 1 },
  toolkitTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', marginBottom: 2 },
  toolkitDesc: { fontSize: 13, fontFamily: 'Manrope_500Medium', lineHeight: 20 },
  
  settingsGroup: { borderRadius: RADIUS.lg, borderWidth: 1, ...SHADOWS.subtle, overflow: 'hidden' },
  settingRowGrouped: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1 },
  settingTextCol: { flex: 1, paddingRight: 15 },
  settingTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', marginBottom: 2 },
  settingDesc: { fontSize: 13, fontFamily: 'Manrope_500Medium', lineHeight: 20 },
  chevronText: { fontSize: 14, fontFamily: 'Manrope_700Bold' },
  
  eraseBtnContainer: { marginTop: 15, alignItems: 'center' },
  eraseText: { color: '#FF747D', fontFamily: 'Manrope_700Bold', fontSize: 15, textDecorationLine: 'underline' },
  
  modalOverlayBase: { flex: 1, backgroundColor: 'rgba(0,0,0, 0.65)', justifyContent: 'center', padding: 25 },
  modalBox: { borderRadius: RADIUS.lg, padding: 25, borderWidth: 1, ...SHADOWS.subtle },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontFamily: 'Manrope_800ExtraBold', marginBottom: 10 },
  modalDesc: { fontSize: 14, fontFamily: 'Manrope_500Medium', lineHeight: 22 },
  modalInput: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: RADIUS.md, fontSize: 16, fontFamily: 'Manrope_600SemiBold', borderWidth: 1, marginBottom: 25, marginTop: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  modalBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1 },
  modalBtnCancelText: { fontFamily: 'Manrope_700Bold', fontSize: 15 },
  modalBtnSave: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  modalBtnSaveText: { fontFamily: 'Manrope_700Bold', fontSize: 15 },
  
  helpCard: { flexDirection: 'row', borderRadius: RADIUS.md, padding: 18, marginBottom: 15, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  helpTextCol: { flex: 1, paddingRight: 15 },
  helpTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, marginBottom: 4 },
  helpDesc: { fontFamily: 'Manrope_500Medium', fontSize: 13 },
  callBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }
});