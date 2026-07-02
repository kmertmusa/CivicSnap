import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeIssueImage } from '../../services/gemini';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/auth';
import { getMockMode } from '../../services/storage';
import ShimmerLoader from '../../components/ShimmerLoader';
import AnimatedPressable from '../../components/AnimatedPressable';

export default function DetailsScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const latitude = parseFloat(params.latitude as string || '0');
  const longitude = parseFloat(params.longitude as string || '0');
  const address = params.address as string || '';

  const [isLoading, setIsLoading] = useState(true);
  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [description, setDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Run Gemini analysis on mount
  useEffect(() => {
    let active = true;
    const runAnalysis = async () => {
      try {
        const response = await analyzeIssueImage(imageUri);
        if (active) {
          setIssueType(response.issue_type);
          setSeverity(response.severity);
          setDescription(response.description);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('AI Analysis failed:', err);
        if (active) {
          setIsLoading(false);
          // If Gemini fails, notify and let the user fill details manually
          Alert.alert(
            'Analysis Unavailable',
            err instanceof Error ? err.message : 'Gemini could not process this image. You can still file the report by filling the fields manually.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    runAnalysis();
    return () => {
      active = false;
    };
  }, [imageUri]);

  const handleSubmit = async () => {
    if (!issueType.trim()) {
      Alert.alert('Validation Error', 'Please enter an issue type.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description.');
      return;
    }

    try {
      setIsSubmitting(true);

      let finalImageUrl = imageUri;

      // If mock mode is inactive, try uploading the file to Supabase Storage!
      const mockMode = await getMockMode();
      if (!mockMode) {
        try {
          // Fetch the local file as a blob
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          // Generate a unique filename using userId and timestamp
          const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${session?.user?.id}/${Date.now()}.${fileExt}`;
          
          // Upload to Supabase Storage bucket 'issue-images'
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('issue-images')
            .upload(fileName, blob, {
              contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
              upsert: true,
            });
            
          if (uploadError) {
            console.error('Supabase Storage Upload error:', uploadError);
          } else if (uploadData) {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('issue-images')
              .getPublicUrl(fileName);
            
            if (urlData) {
              finalImageUrl = urlData.publicUrl;
              console.log('Image uploaded successfully! Public URL:', finalImageUrl);
            }
          }
        } catch (uploadFail) {
          console.error('Failed to upload image, falling back to local URI:', uploadFail);
        }
      }

      const { error } = await supabase.from('reports').insert([
        {
          user_id: session?.user?.id,
          image_url: finalImageUrl,
          issue_type: issueType.trim(),
          severity,
          description: description.trim(),
          latitude,
          longitude,
          address: address || null,
          status: 'Pending',
        },
      ]);

      if (error) throw new Error(error.message);
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Delay for success overlay display then navigate home
      setTimeout(() => {
        router.dismissAll();
        router.replace('/(tabs)');
      }, 2000);

    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const renderSkeleton = () => (
    <View className="space-y-6">
      {/* AI Analyzing HUD indicator */}
      <View className="bg-sky-50 dark:bg-sky-500/5 border border-sky-100 dark:border-sky-500/10 p-4 rounded-2xl flex-row items-center mb-6">
        <ActivityIndicator size="small" color="#0284c7" />
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold text-sky-800 dark:text-sky-400">Gemini Vision AI at work</Text>
          <Text className="text-[10px] text-sky-600/70 dark:text-sky-400/50 mt-0.5">Categorizing issue, measuring severity and detailing damage...</Text>
        </View>
      </View>

      {/* Shimmer items */}
      <View className="mb-5">
        <ShimmerLoader width={80} height={14} className="mb-2" />
        <ShimmerLoader height={48} borderRadius={16} />
      </View>

      <View className="mb-5">
        <ShimmerLoader width={100} height={14} className="mb-2.5" />
        <View className="flex-row space-x-3 justify-between">
          <View className="flex-1 mr-2"><ShimmerLoader height={40} borderRadius={12} /></View>
          <View className="flex-1 mr-2"><ShimmerLoader height={40} borderRadius={12} /></View>
          <View className="flex-1"><ShimmerLoader height={40} borderRadius={12} /></View>
        </View>
      </View>

      <View className="mb-6">
        <ShimmerLoader width={90} height={14} className="mb-2" />
        <ShimmerLoader height={100} borderRadius={16} />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 justify-between">
            <AnimatedPressable
              onPress={() => router.back()}
              className="w-9 h-9 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} className="text-slate-700 dark:text-slate-300" />
            </AnimatedPressable>
            
            <Text className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              Verify Report
            </Text>
            
            <View className="w-9 h-9" />
          </View>

          {/* Captured Image Preview */}
          <View className="px-4 mb-5">
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: 200, borderRadius: 24 }}
              contentFit="cover"
              className="bg-neutral-200 dark:bg-neutral-800"
            />
          </View>

          {/* Form Container */}
          <View className="px-4">
            {isLoading ? (
              renderSkeleton()
            ) : (
              <View>
                {/* Issue Type Input */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Issue Category
                  </Text>
                  <TextInput
                    value={issueType}
                    onChangeText={setIssueType}
                    placeholder="e.g. Pothole, Broken Streetlight"
                    placeholderTextColor="#94a3b8"
                    className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                  />
                </View>

                {/* Severity Selection Chips */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Measured Severity
                  </Text>
                  <View className="flex-row">
                    {(['Low', 'Medium', 'High'] as const).map((sev) => {
                      const isActive = severity === sev;
                      let activeStyle = '';
                      let textStyle = 'text-slate-500 dark:text-slate-400';
                      
                      if (isActive) {
                        textStyle = 'text-white font-extrabold';
                        if (sev === 'Low') activeStyle = 'bg-emerald-500';
                        else if (sev === 'Medium') activeStyle = 'bg-amber-500';
                        else activeStyle = 'bg-rose-500';
                      }

                      return (
                        <AnimatedPressable
                          key={sev}
                          onPress={() => setSeverity(sev)}
                          className={`flex-1 py-2.5 rounded-xl border border-slate-100 dark:border-neutral-800/60 items-center justify-center mr-2 shadow-xs bg-white dark:bg-neutral-900 ${activeStyle}`}
                        >
                          <Text className={`text-xs font-bold ${textStyle}`}>{sev}</Text>
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                </View>

                {/* Description Multiline Input */}
                <View className="mb-5">
                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Detailed Description
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Provide details about the damage..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800/80 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-xs min-h-[96px]"
                  />
                </View>

                {/* Geolocation Information HUD */}
                <View className="bg-slate-100/60 dark:bg-neutral-900 border border-slate-200/40 dark:border-neutral-800 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="location-sharp" size={16} color="#0284c7" />
                    <Text className="text-xs font-extrabold text-slate-700 dark:text-slate-300 ml-1.5">
                      Attached Metadata Location
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1 leading-4">
                    {address || 'Fetching Address...'}
                  </Text>
                  <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </Text>
                </View>

                {/* Submit Trigger */}
                <AnimatedPressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-sky-600 dark:bg-sky-500 py-4 rounded-2xl shadow-lg shadow-sky-600/20 items-center justify-center flex-row"
                >
                  <Text className="text-white font-extrabold text-sm mr-2">Submit Official Report</Text>
                  <Ionicons name="send" size={14} color="white" />
                </AnimatedPressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submission Success Screen Overlay */}
      {showSuccess && (
        <View className="absolute inset-0 bg-slate-900/95 dark:bg-black/95 items-center justify-center z-50 px-6">
          <View className="w-20 h-20 bg-emerald-500/10 rounded-full items-center justify-center border border-emerald-500/30 mb-6">
            <Ionicons name="checkmark-circle" size={56} color="#10b981" />
          </View>
          
          <Text className="text-2xl font-black text-white text-center tracking-tight">
            Report Lodged Successfully!
          </Text>
          
          <Text className="text-sm text-slate-400 text-center mt-3 max-w-[280px] leading-5 font-semibold">
            Thank you! Your submission has been captured. Local municipal agents will inspect this shortly.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
