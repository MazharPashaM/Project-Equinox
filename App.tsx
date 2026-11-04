import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ThemeProvider, useTheme } from './theme';

import HomeScreen from './screens/HomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import GreetingScreen from './screens/GreetingScreen';
import CheckInScreen from './screens/CheckInScreen';
import TrendScreen from './screens/TrendScreen';
import BreatheScreen from './screens/BreatheScreen';
import QuoteViewerScreen from './screens/QuoteViewerScreen';
import ProfileScreen from './screens/ProfileScreen';
import CounsellorScreen from './screens/CounsellorScreen';
import CustomTabBar from './components/CustomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator 
      tabBar={(props) => <CustomTabBar {...props} />} 
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="QuoteViewer" component={QuoteViewerScreen} />
      <Tab.Screen name="Trend" component={TrendScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function NavigationWrapper({ isFirstLaunch }: { isFirstLaunch: boolean }) {
  const { isDark, COLORS } = useTheme();
  
  const ActiveTheme = isDark ? DarkTheme : DefaultTheme;
  const NavigationTheme = { 
    ...ActiveTheme, 
    colors: { 
      ...ActiveTheme.colors, 
      background: COLORS.backgroundPrimary 
    } 
  };

  return (
    <NavigationContainer theme={NavigationTheme}>
      <Stack.Navigator 
        initialRouteName={isFirstLaunch ? "Onboarding" : "MainTabs"} 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade', // Smooth cross-fade transition between screens
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Greeting" component={GreetingScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Breathe" component={BreatheScreen} />
        <Stack.Screen name="Counsellor" component={CounsellorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  let [fontsLoaded] = useFonts({ 
    Manrope_400Regular, 
    Manrope_500Medium, 
    Manrope_600SemiBold, 
    Manrope_700Bold, 
    Manrope_800ExtraBold 
  });

  // Check if the user has any saved mood check-in records
  useEffect(() => {
    async function checkInitialRoute() {
      try {
        const existingData = await AsyncStorage.getItem('equinox_checkins');
        if (existingData) {
          const parsed = JSON.parse(existingData);
          // If the array exists and has at least 1 record, go to Home Screen
          if (parsed && parsed.length > 0) {
            setIsFirstLaunch(false);
            return;
          }
        }
        // If data is null or the array is empty, force Onboarding Screen
        setIsFirstLaunch(true);
      } catch (error) {
        // Fallback to Home if there's an unexpected storage read error
        setIsFirstLaunch(false);
      }
    }
    
    checkInitialRoute();
  }, []);

  // Wait until both fonts and launch state are resolved
  if (!fontsLoaded || isFirstLaunch === null) {
    return <View style={{ flex: 1, backgroundColor: '#071039' }} />;
  }

  return (
    <ThemeProvider>
      <NavigationWrapper isFirstLaunch={isFirstLaunch} />
    </ThemeProvider>
  );
}