import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Animated, TouchableOpacity, Modal, Image, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { RADIUS, SHADOWS, useTheme } from '../theme';
import { globalNavDirection } from '../components/CustomTabBar';

const { width } = Dimensions.get('window');
const MOOD_EMOJIS = ['😭', '😔', '😐', '🙂', '🤩'];
const MOOD_LABELS = ['Mentally Exhausted', 'Feeling Low', 'Just Okay', 'Pretty Good', 'Feeling Great'];

// Dynamic Timeline Card that pops up when rendered on scroll
const TimelineCard = ({ record, index, isSelected, onPress, onLongPress, isSelectionMode, COLORS, isDark }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, friction: 8, tension: 50, useNativeDriver: true,
      delay: Math.min(index * 100, 300) 
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <TouchableOpacity 
        style={[styles.timelineCard, { backgroundColor: COLORS.surfaceCard, borderColor: isSelected ? COLORS.statusDanger : COLORS.border }, isSelected && { backgroundColor: isDark ? 'rgba(255, 116, 125, 0.1)' : 'rgba(230, 57, 70, 0.1)' }]} 
        onPress={() => onPress(record)} 
        onLongPress={() => onLongPress(record)} 
        delayLongPress={350} 
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={[styles.moodBadge, { backgroundColor: COLORS.surfaceElevated, borderColor: isSelected ? COLORS.statusDanger : COLORS.border }]}>
             <Text style={styles.emojiText}>{record.type === 'photo' ? '🖼️' : MOOD_EMOJIS[record.mood - 1]}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={[styles.cardMoodLabel, { color: COLORS.textPrimary }]}>{record.type === 'photo' ? 'Photo Memory' : MOOD_LABELS[record.mood - 1]}</Text>
            <Text style={[styles.cardTime, { color: COLORS.textMuted }]}>{new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          {isSelected && <View style={[styles.selectionCheckmark, { backgroundColor: COLORS.statusDanger }]}><Text style={styles.checkmarkText}>✓</Text></View>}
        </View>
        
        <View style={styles.cardTagsRow}>
           {[...(record.activities || []), ...(record.feelings || [])].slice(0, 4).map((tag, tIdx) => (
             <View key={tIdx} style={[styles.smallTag, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]}><Text style={[styles.smallTagText, { color: COLORS.textSecondary }]}>{tag}</Text></View>
           ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function TrendScreen() {
  const { COLORS, isDark } = useTheme();

  const [chartData, setChartData] = useState<number[]>([3]);
  const [chartLabels, setChartLabels] = useState<string[]>(['Today']);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isSelectionMode = selectedForDelete.length > 0;
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animHeader = useRef(new Animated.Value(0)).current;
  const animChart = useRef(new Animated.Value(0)).current;
  const animTimelineList = useRef(new Animated.Value(0)).current;

  const chartScrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      const startX = globalNavDirection === 'right' ? width * 0.15 : -width * 0.15;
      slideAnim.setValue(startX);
      [animHeader, animChart, animTimelineList].forEach(a => a.setValue(0));
      
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.stagger(50, [
          Animated.spring(animHeader, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animChart, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.spring(animTimelineList, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        ])
      ]).start();
      
      loadData();
      return () => { setSelectedForDelete([]); setShowDeleteConfirm(false); };
    }, [slideAnim, animHeader, animChart, animTimelineList])
  );

  const processAndSetData = (parsedRecords: any[]) => {
    if (parsedRecords.length > 0) {
      // Sort chronologically (oldest to newest) for proper graph plotting
      const sortedChronological = [...parsedRecords].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const moodOnly = sortedChronological.filter((r: any) => r.type !== 'photo');
      const chartPoints = moodOnly.slice(-15);

      if (chartPoints.length > 0) {
        setChartData(chartPoints.map((e: any) => e.mood));
        
        // Date-only label formatting (removing timestamp)
        setChartLabels(chartPoints.map((e: any) => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })));
      } else {
        setChartData([3]); 
        setChartLabels(['No Data']);
      }

      // Timeline history displays newest first
      setHistoryRecords([...parsedRecords].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())); 
    } else {
      setChartData([3]); 
      setChartLabels(['No Data']); 
      setHistoryRecords([]);
    }
  };

  const loadData = async () => {
    try {
      const existingData = await AsyncStorage.getItem('equinox_checkins');
      if (existingData) {
        processAndSetData(JSON.parse(existingData));
      } else {
        processAndSetData([]);
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      chartScrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [chartData]);

  const handleRecordPress = (record: any) => {
    if (isSelectionMode) setSelectedForDelete(prev => prev.includes(record.date) ? prev.filter(d => d !== record.date) : [...prev, record.date]);
    else setSelectedRecord(record);
  };

  const handleRecordLongPress = (record: any) => {
    if (!isSelectionMode) setSelectedForDelete([record.date]);
  };

  const deleteSelectedRecords = async () => {
    try {
      const existingData = await AsyncStorage.getItem('equinox_checkins');
      if (existingData) {
        const parsed = JSON.parse(existingData);
        // Filter out all records matching any of the selected dates
        const remainingData = parsed.filter((r: any) => !selectedForDelete.includes(r.date));
        
        // Save back the clean array
        await AsyncStorage.setItem('equinox_checkins', JSON.stringify(remainingData));
        
        setShowDeleteConfirm(false);
        setSelectedForDelete([]);
        
        // Instantly update chart and timeline state
        processAndSetData(remainingData);
      }
    } catch (error) { console.error(error); }
  };

  // Group Records Elegantly by Date
  const groupedRecords = useMemo(() => {
    const groups: any[] = [];
    let currentGroup: any = null;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    historyRecords.forEach((r) => {
      const d = new Date(r.date);
      const dateStr = d.toDateString();

      if (!currentGroup || currentGroup.dateStr !== dateStr) {
        let rightTop = '';
        if (dateStr === today.toDateString()) rightTop = 'Today';
        else if (dateStr === yesterday.toDateString()) rightTop = 'Yesterday';
        else rightTop = d.toLocaleDateString('en-US', { weekday: 'long' });

        currentGroup = {
          dateStr,
          leftNum: d.getDate().toString(),
          leftMonth: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          rightTop: rightTop,
          rightBottom: d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
          data: []
        };
        groups.push(currentGroup);
      }
      currentGroup.data.push(r);
    });
    return groups;
  }, [historyRecords]);

  const chartLineColor = isDark ? '252, 163, 17' : '8, 126, 245'; 
  const chartLabelColor = isDark ? '169, 185, 209' : '7, 16, 57';

  const getSlideStyle = (animValue: Animated.Value, translateYOffset = 25) => ({
    opacity: animValue,
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [translateYOffset, 0] }) }]
  });

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <View style={[styles.ambientGlow, { backgroundColor: isDark ? 'rgba(25, 207, 240, 0.15)' : 'rgba(8, 126, 245, 0.15)' }]} />

      <Animated.View style={[styles.header, getSlideStyle(animHeader, 15)]}>
        {isSelectionMode ? (
          <View style={styles.selectionHeaderRow}>
            <TouchableOpacity onPress={() => setSelectedForDelete([])}>
              <Text style={[styles.headerActionText, { color: COLORS.accentCyan }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>{selectedForDelete.length} Selected</Text>
            <TouchableOpacity onPress={() => setShowDeleteConfirm(true)}>
              <Text style={[styles.headerActionText, { color: COLORS.statusDanger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Insights & Records</Text>
        )}
      </Animated.View>

      <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        
        <Animated.View style={[styles.card, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }, getSlideStyle(animChart)]}>
          <Text style={[styles.cardTitle, { color: COLORS.textPrimary }]}>Mood Analytics</Text>
          <View style={styles.chartRow}>
            {/* Fixed Constant Y-Axis */}
            <View style={styles.fixedYAxis}>
              <Text style={[styles.yAxisLabel, { color: `rgba(${chartLabelColor}, 0.8)` }]}>5</Text>
              <Text style={[styles.yAxisLabel, { color: `rgba(${chartLabelColor}, 0.8)` }]}>4</Text>
              <Text style={[styles.yAxisLabel, { color: `rgba(${chartLabelColor}, 0.8)` }]}>3</Text>
              <Text style={[styles.yAxisLabel, { color: `rgba(${chartLabelColor}, 0.8)` }]}>2</Text>
              <Text style={[styles.yAxisLabel, { color: `rgba(${chartLabelColor}, 0.8)` }]}>1</Text>
            </View>

            {/* Scrollable Chart with date-only labels */}
            <ScrollView 
              ref={chartScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ flex: 1 }}
            >
              <LineChart
                data={{ labels: chartLabels, datasets: [{ data: chartData }, { data: [1], withDots: false, color: () => 'transparent' }, { data: [5], withDots: false, color: () => 'transparent' }] }}
                width={Math.max(width - 80, chartData.length * 75)} 
                height={190} yAxisLabel="" yAxisSuffix="" yAxisInterval={1} segments={4} 
                withHorizontalLabels={false} withVerticalLabels={true} 
                chartConfig={{ 
                  backgroundColor: 'transparent', backgroundGradientFromOpacity: 0, backgroundGradientToOpacity: 0, decimalPlaces: 0, 
                  color: (opacity = 1) => `rgba(${chartLineColor}, ${opacity})`, 
                  labelColor: (opacity = 1) => `rgba(${chartLabelColor}, ${opacity})`, 
                  style: { borderRadius: RADIUS.md }, 
                  propsForDots: { r: "5", strokeWidth: "2", stroke: COLORS.accentElectricBlue }, 
                  propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: "" }, 
                  propsForLabels: { fontSize: 10 },
                }}
                bezier style={{ paddingTop: 10, marginLeft: -35 }} 
              />
            </ScrollView>
          </View>
        </Animated.View>
        
        <Animated.View style={getSlideStyle(animTimelineList)}>
          {groupedRecords.length === 0 ? (
            <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>No records yet.</Text>
          ) : (
            groupedRecords.map((group, gIdx) => (
              <View key={gIdx} style={styles.groupContainer}>
                 
                 {/* Visual Date Segregation */}
                 <View style={styles.groupHeader}>
                    <View style={styles.dateLeft}>
                        <Text style={[styles.dateNum, { color: COLORS.textPrimary }]}>{group.leftNum}</Text>
                        <Text style={[styles.dateMonth, { color: COLORS.textSecondary }]}>{group.leftMonth}</Text>
                    </View>
                    <View style={styles.dateRight}>
                        <Text style={[styles.dateTop, { color: COLORS.textPrimary }]}>{group.rightTop}</Text>
                        <Text style={[styles.dateBottom, { color: COLORS.textSecondary }]}>{group.rightBottom}</Text>
                    </View>
                 </View>

                 {group.data.map((record: any, index: number) => (
                   <TimelineCard 
                     key={index} index={index} record={record} COLORS={COLORS} isDark={isDark}
                     isSelected={selectedForDelete.includes(record.date)} isSelectionMode={isSelectionMode}
                     onPress={handleRecordPress} onLongPress={handleRecordLongPress}
                   />
                 ))}
              </View>
            ))
          )}
        </Animated.View>

      </Animated.ScrollView>

      {/* Modals remain structurally identical */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.warningBox, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            <Text style={[styles.warningTitle, { color: COLORS.statusDanger }]}>Delete Records</Text>
            <Text style={[styles.warningText, { color: COLORS.textSecondary }]}>Are you sure you want to permanently delete {selectedForDelete.length} record(s)?</Text>
            <View style={styles.warningActions}>
              <TouchableOpacity style={[styles.cancelWarningBtn, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={[styles.cancelWarningText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDeleteBtn, { borderColor: COLORS.statusDanger, backgroundColor: isDark ? 'rgba(255, 116, 125, 0.15)' : 'rgba(230, 57, 70, 0.1)' }]} onPress={deleteSelectedRecords}>
                <Text style={[styles.confirmDeleteText, { color: COLORS.statusDanger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedRecord} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedRecord(null)}>
          <Pressable style={[styles.detailCard, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                   <Text style={[styles.detailDate, { color: COLORS.textPrimary }]}>{new Date(selectedRecord.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                   <TouchableOpacity onPress={() => setSelectedRecord(null)}><Text style={[styles.closeBtn, { color: COLORS.textMuted }]}>✕</Text></TouchableOpacity>
                </View>
                {selectedRecord.type === 'photo' ? (
                  <>
                    <Image source={{ uri: selectedRecord.imageUri }} style={styles.detailImage} />
                    <Text style={[styles.detailNote, { color: COLORS.textSecondary }]}>{selectedRecord.note}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.detailMoodLabel, { color: COLORS.accentAmber }]}>Mood: {MOOD_EMOJIS[selectedRecord.mood - 1]}</Text>
                    {selectedRecord.title ? <Text style={[styles.detailTitle, { color: COLORS.textPrimary }]}>{selectedRecord.title}</Text> : null}
                    {selectedRecord.note ? <Text style={[styles.detailNote, { color: COLORS.textSecondary }]}>{selectedRecord.note}</Text> : null}
                    <View style={styles.chipRow}>
                      {selectedRecord.activities?.map((act: string) => <View key={act} style={[styles.chip, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.border }]}><Text style={[styles.chipText, { color: COLORS.textSecondary }]}>{act}</Text></View>)}
                      {selectedRecord.feelings?.map((feel: string) => <View key={feel} style={[styles.chip, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.accentCyan }]}><Text style={[styles.chipText, { color: COLORS.accentCyan }]}>{feel}</Text></View>)}
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, filter: 'blur(40px)', opacity: 0.8 },
  header: { justifyContent: 'center', paddingTop: 60, paddingBottom: 10, paddingHorizontal: 20, minHeight: 100 },
  selectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  headerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 22, textAlign: 'center' },
  headerActionText: { fontFamily: 'Manrope_700Bold', fontSize: 16 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  card: { borderRadius: RADIUS.lg, paddingVertical: 20, paddingHorizontal: 15, borderWidth: 1, ...SHADOWS.subtle, marginBottom: 25, overflow: 'hidden' },
  cardTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 18, marginBottom: 15, textAlign: 'center' },
  
  chartRow: { flexDirection: 'row', alignItems: 'center' },
  fixedYAxis: { height: 190, justifyContent: 'space-between', paddingBottom: 28, paddingTop: 10, paddingRight: 4, alignItems: 'flex-end' },
  yAxisLabel: { fontSize: 11, fontFamily: 'Manrope_500Medium' },

  groupContainer: { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15, paddingHorizontal: 5 },
  dateLeft: { alignItems: 'center', minWidth: 40 },
  dateNum: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold', lineHeight: 28 },
  dateMonth: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1 },
  dateRight: { flex: 1 },
  dateTop: { fontSize: 18, fontFamily: 'Manrope_700Bold' },
  dateBottom: { fontSize: 10, fontFamily: 'Manrope_700Bold', letterSpacing: 1 },

  timelineCard: { borderRadius: RADIUS.lg, padding: 18, marginBottom: 15, borderWidth: 1, ...SHADOWS.subtle },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  moodBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1 },
  cardHeaderInfo: { flex: 1 },
  cardMoodLabel: { fontSize: 16, fontFamily: 'Manrope_700Bold', marginBottom: 2 },
  cardTime: { fontSize: 12, fontFamily: 'Manrope_500Medium' },
  emojiText: { fontSize: 18 },
  cardTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallTag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.pill, borderWidth: 1 },
  smallTagText: { fontSize: 11, fontFamily: 'Manrope_600SemiBold' },

  selectionCheckmark: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  checkmarkText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  
  emptyText: { fontFamily: 'Manrope_500Medium', textAlign: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', padding: 20 },
  warningBox: { borderRadius: RADIUS.lg, padding: 25, borderWidth: 1, ...SHADOWS.subtle },
  warningTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 20, marginBottom: 10, textAlign: 'center' },
  warningText: { fontFamily: 'Manrope_500Medium', fontSize: 15, marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  warningActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  cancelWarningBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1 },
  cancelWarningText: { fontFamily: 'Manrope_700Bold', fontSize: 15 },
  confirmDeleteBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1 },
  confirmDeleteText: { fontFamily: 'Manrope_700Bold', fontSize: 15 },
  detailCard: { borderRadius: RADIUS.lg, padding: 25, borderWidth: 1, maxHeight: '80%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailDate: { fontFamily: 'Manrope_800ExtraBold', fontSize: 18 },
  closeBtn: { fontSize: 24, fontFamily: 'Manrope_500Medium' },
  detailMoodLabel: { fontFamily: 'Manrope_700Bold', fontSize: 20, marginBottom: 15 },
  detailTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, marginBottom: 10 },
  detailNote: { fontFamily: 'Manrope_500Medium', fontSize: 16, marginBottom: 20, lineHeight: 24 },
  detailImage: { width: '100%', height: 250, borderRadius: RADIUS.md, marginBottom: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.pill, borderWidth: 1 },
  chipText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12 },
});