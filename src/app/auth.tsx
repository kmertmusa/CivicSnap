import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import AnimatedPressable from '../components/AnimatedPressable';

type AuthMode = 'login' | 'signup';
type UserRole = 'citizen' | 'authority';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('citizen');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Zayıf Şifre', 'Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    try {
      setIsLoading(true);
      
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          throw new Error(error.message);
        }
      } else {
        // SignUp flow with options role payload
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: 'mobil://auth-callback',
            data: {
              role: role,
            },
          },
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        Alert.alert('Kayıt Başarılı', 'Hesabınız başarıyla oluşturuldu ve giriş yapıldı.');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      Alert.alert('Giriş/Kayıt Hatası', err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 px-6 justify-center">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="justify-center"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }}>
          
          {/* Logo & Header */}
          <View className="items-center mb-8 mt-4 flex-col flex">
            <View className="w-16 h-16 bg-sky-600 dark:bg-sky-500 rounded-3xl items-center justify-center shadow-lg shadow-sky-500/20 mb-4">
              <Ionicons name="chatbubbles" size={32} color="white" />
            </View>
            <Text className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              CivicSnap
            </Text>
            <Text className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1.5 text-center max-w-[240px]">
              Akıllı Şehir Asistanı ve Altyapı Bildirim Sistemi
            </Text>
          </View>

          {/* Login/Signup Tabs */}
          <View className="flex-row bg-slate-200/60 dark:bg-neutral-900 border border-slate-200/20 dark:border-neutral-800 p-1 rounded-2xl mb-6">
            <AnimatedPressable
              onPress={() => setMode('login')}
              className={`flex-1 py-3 rounded-xl items-center ${mode === 'login' ? 'bg-white dark:bg-neutral-800 shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-bold ${mode === 'login' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                Giriş Yap
              </Text>
            </AnimatedPressable>
            
            <AnimatedPressable
              onPress={() => setMode('signup')}
              className={`flex-1 py-3 rounded-xl items-center ${mode === 'signup' ? 'bg-white dark:bg-neutral-800 shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-bold ${mode === 'signup' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                Kayıt Ol
              </Text>
            </AnimatedPressable>
          </View>

          {/* Form Card */}
          <View className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-3xl p-5 shadow-sm shadow-neutral-100 dark:shadow-none">
            
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                E-POSTA ADRESİ
              </Text>
              <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex-row items-center px-4 py-3">
                <Ionicons name="mail-outline" size={18} color="#94a3b8" className="mr-3" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCorrect={false}
                  autoCapitalize="none"
                  className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                ŞİFRE
              </Text>
              <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex-row items-center px-4 py-3">
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" className="mr-3" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                  className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2"
                />
                <AnimatedPressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#64748b" 
                  />
                </AnimatedPressable>
              </View>
            </View>

            {/* Role Selection (Only displayed on Signup mode) */}
            {mode === 'signup' && (
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  KULLANICI ROLÜ
                </Text>
                <View className="flex-row">
                  {/* Citizen Role Option */}
                  <AnimatedPressable
                    onPress={() => setRole('citizen')}
                    className={`flex-1 py-3 border border-slate-100 dark:border-neutral-800/80 rounded-2xl items-center mr-2 flex-row justify-center ${role === 'citizen' ? 'bg-sky-500 border-sky-500' : 'bg-slate-50 dark:bg-slate-950'}`}
                  >
                    <Ionicons 
                      name="people" 
                      size={16} 
                      color={role === 'citizen' ? 'white' : '#64748b'} 
                    />
                    <Text className={`text-xs font-bold ml-2 ${role === 'citizen' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      Vatandaş
                    </Text>
                  </AnimatedPressable>

                  {/* Authority Role Option */}
                  <AnimatedPressable
                    onPress={() => setRole('authority')}
                    className={`flex-1 py-3 border border-slate-100 dark:border-neutral-800/80 rounded-2xl items-center flex-row justify-center ${role === 'authority' ? 'bg-purple-600 border-purple-600' : 'bg-slate-50 dark:bg-slate-950'}`}
                  >
                    <Ionicons 
                      name="business" 
                      size={16} 
                      color={role === 'authority' ? 'white' : '#64748b'} 
                    />
                    <Text className={`text-xs font-bold ml-2 ${role === 'authority' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      Belediye Yetkilisi
                    </Text>
                  </AnimatedPressable>
                </View>
              </View>
            )}

            {/* Action Trigger */}
            <AnimatedPressable
              onPress={handleAuthAction}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl items-center justify-center flex-row shadow-sm ${mode === 'login' ? 'bg-sky-600 dark:bg-sky-500 shadow-sky-500/10' : 'bg-purple-600 shadow-purple-600/10'}`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text className="text-white font-black text-sm mr-2">
                    {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </Text>
                  <Ionicons 
                    name={mode === 'login' ? 'log-in' : 'person-add'} 
                    size={16} 
                    color="white" 
                  />
                </>
              )}
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
