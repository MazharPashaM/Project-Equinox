import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme';

export default function AddPhotoScreen({ navigation }: any) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!photoUri) return;
    try {
      const newRecord = { 
        type: 'photo',
        photoUri,
        note, 
        date: new Date().toISOString() 
      };
      const existingData = await AsyncStorage.getItem('equinox_checkins');
      const checkinsArray = existingData ? JSON.parse(existingData) : [];
      checkinsArray.push(newRecord);
      await AsyncStorage.setItem('equinox_checkins', JSON.stringify(checkinsArray));
      
      navigation.goBack();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Memory</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.selectedImage} />
          ) : (
            <View style={styles.placeholderContent}>
              <Image source={{ uri: 'https://img.icons8.com/ios-filled/50/FFB52E/camera.png' }} style={styles.cameraIcon} />
              <Text style={styles.placeholderText}>Tap to select a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput 
          style={styles.noteInput} 
          placeholder="Add a description or note..." 
          placeholderTextColor={COLORS.textMuted} 
          value={note} onChangeText={setNote} 
          multiline 
          selectionColor={COLORS.accentCyan}
        />
      </View>

      <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.saveBtn, !photoUri && { opacity: 0.5 }]} onPress={handleSave} disabled={!photoUri}>
              <Text style={styles.saveBtnText}>SAVE PHOTO</Text>
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  backIcon: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  headerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 22, color: COLORS.textPrimary },
  
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 10 },
  imagePlaceholder: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 25 },
  placeholderContent: { alignItems: 'center' },
  cameraIcon: { width: 40, height: 40, tintColor: COLORS.accentAmber, marginBottom: 10 },
  placeholderText: { fontFamily: 'Manrope_600SemiBold', color: COLORS.textSecondary },
  selectedImage: { width: '100%', height: '100%' },

  noteInput: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, padding: 20, fontSize: 16, fontFamily: 'Manrope_500Medium', color: COLORS.textPrimary, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  
  bottomBar: { padding: 30, paddingBottom: 50 },
  saveBtn: { width: '100%', paddingVertical: 18, borderRadius: RADIUS.pill, backgroundColor: COLORS.accentElectricBlue, alignItems: 'center', ...SHADOWS.glowCyan },
  saveBtnText: { color: COLORS.textPrimary, fontSize: 15, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1 },
});