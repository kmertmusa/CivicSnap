import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  getApiKey, 
  saveApiKey, 
  deleteApiKey, 
  getMockMode, 
  setMockMode, 
  clearReports 
} from '../../services/storage';
import AnimatedPressable from '../../components/AnimatedPressable';
import { useAuth } from '../../context/auth';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [mockMode, setMockModeState] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const loadSettings = async () => {
      const savedKey = await getApiKey();
      const savedMockMode = await getMockMode();
      
      if (savedKey) {
        setApiKey(savedKey);
        setIsSaved(true);
      }
      setMockModeState(savedMockMode);
    };
    
    loadSettings();
  }, []);

  const handleSaveApiKey = async () => {
    try {
      if (!apiKey.trim()) {
        await deleteApiKey();
        setIsSaved(false);
        Alert.alert('API Key Cleared', 'The Gemini API Key has been removed.');
      } else {
        await saveApiKey(apiKey.trim());
        setIsSaved(true);
        Alert.alert('API Key Saved', 'The Gemini API Key is stored securely on your device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save Gemini API Key.');
    }
  };

  const handleToggleMockMode = async (value: boolean) => {
    setMockModeState(value);
    await setMockMode(value);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Reports',
      'Are you sure you want to delete all historical reports? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            await clearReports();
            Alert.alert('Database Cleared', 'All reports have been deleted.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Profile Card */}
        <View className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-5 mb-5 shadow-sm shadow-neutral-100 dark:shadow-none flex-row justify-between items-center">
          <View className="flex-row items-center flex-1 mr-4">
            <View className="w-12 h-12 bg-sky-100 dark:bg-sky-500/10 rounded-2xl items-center justify-center mr-3">
              <Ionicons name="person" size={24} color="#0284c7" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                {profile?.email}
              </Text>
              <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                Rol: {profile?.role === 'authority' ? 'Belediye Yetkilisi' : 'Vatandaş'}
              </Text>
            </View>
          </View>
          <AnimatedPressable
            onPress={() => signOut()}
            className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl"
          >
            <Text className="text-slate-600 dark:text-slate-350 font-bold text-xs">Çıkış Yap</Text>
          </AnimatedPressable>
        </View>

        {/* Header Title */}
        <View className="mb-6 mt-4">
          <Text className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Configuration
          </Text>
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Configure integrations and application settings.
          </Text>
        </View>

        {/* Gemini Vision API Key Section */}
        <View className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-5 mb-5 shadow-sm shadow-neutral-100 dark:shadow-none">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-sky-100 dark:bg-sky-500/10 rounded-xl items-center justify-center mr-3">
              <Ionicons name="key" size={18} color="#0284c7" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                Gemini Vision API
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                Required for real-time infrastructure analysis.
              </Text>
            </View>
          </View>

          {/* Key Input */}
          <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex-row items-center px-4 py-3 mb-3">
            <TextInput
              value={apiKey}
              onChangeText={(text) => {
                setApiKey(text);
                setIsSaved(false);
              }}
              placeholder="AIzaSy..."
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showKey}
              autoCorrect={false}
              autoCapitalize="none"
              className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300 pr-2"
            />
            <AnimatedPressable onPress={() => setShowKey(!showKey)}>
              <Ionicons 
                name={showKey ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color="#64748b" 
              />
            </AnimatedPressable>
          </View>

          {/* Save Button & Status Row */}
          <View className="flex-row justify-between items-center mt-1">
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-2 ${isSaved ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {isSaved ? 'API Key Configured' : 'No Key Configured'}
              </Text>
            </View>
            
            <AnimatedPressable
              onPress={handleSaveApiKey}
              className="bg-slate-800 dark:bg-slate-200 px-4 py-2 rounded-xl"
            >
              <Text className="text-white dark:text-slate-900 font-bold text-xs">
                {isSaved ? 'Update' : 'Save'}
              </Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Simulator / Mock Mode Section */}
        <View className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-5 mb-5 shadow-sm shadow-neutral-100 dark:shadow-none">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1 mr-4">
              <View className="w-8 h-8 bg-purple-100 dark:bg-purple-500/10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="construct" size={18} color="#a855f7" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Mock AI Mode
                </Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Simulates AI image classification responses. Good for testing immediately.
                </Text>
              </View>
            </View>

            <Switch
              value={mockMode}
              onValueChange={handleToggleMockMode}
              trackColor={{ false: '#cbd5e1', true: '#a855f7' }}
              thumbColor={mockMode ? '#ffffff' : '#f4f4f5'}
            />
          </View>

          {mockMode && (
            <View className="bg-purple-50/50 dark:bg-purple-500/5 border border-purple-200/40 dark:border-purple-500/10 rounded-2xl p-3.5 mt-4">
              <Text className="text-[11px] font-medium leading-4 text-purple-700 dark:text-purple-400">
                🚀 <Text className="font-bold">Mock Mode is Active.</Text> Camera captures will not consume Gemini API tokens. The app will return realistic mock details and coordinates after a realistic delay.
              </Text>
            </View>
          )}
        </View>

        {/* Database Management Section */}
        <View className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-5 shadow-sm shadow-neutral-100 dark:shadow-none">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-rose-100 dark:bg-rose-500/10 rounded-xl items-center justify-center mr-3">
              <Ionicons name="trash-bin" size={18} color="#f43f5e" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                Database Management
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                Local storage cleaning utilities.
              </Text>
            </View>
          </View>

          <Text className="text-xs text-slate-400 dark:text-slate-500 mb-4 leading-4">
            Clearing local storage will permanently wipe your issue reports history database on this device.
          </Text>

          <AnimatedPressable
            onPress={handleClearData}
            className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 py-3 rounded-2xl items-center"
          >
            <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-sm">
              Clear All Reports
            </Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
