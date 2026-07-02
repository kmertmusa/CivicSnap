import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCurrentLocation, requestLocationPermission } from '../../services/location';
import AnimatedPressable from '../../components/AnimatedPressable';

const { width } = Dimensions.get('window');

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Check location permission on mount
  useEffect(() => {
    const checkLocation = async () => {
      const granted = await requestLocationPermission();
      setLocationPermissionGranted(granted);
    };
    checkLocation();
  }, []);

  const handleRequestPermissions = async () => {
    const camRes = await requestCameraPermission();
    const locRes = await requestLocationPermission();
    setLocationPermissionGranted(locRes);
  };

  const handleToggleFlash = () => {
    setFlash((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // 1. Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo uri');
      }

      // 2. Fetch location
      let latitude = 0;
      let longitude = 0;
      let address = '';

      try {
        const loc = await fetchCurrentLocation();
        latitude = loc.latitude;
        longitude = loc.longitude;
        address = loc.address || '';
      } catch (locErr) {
        console.warn('Could not fetch location for report, using default coordinates', locErr);
        // Default coordinates (e.g. Istanbul/Centrum mock coordinates or 0)
        latitude = 41.0082;
        longitude = 28.9784;
        address = 'Default Location (GPS Timeout)';
      }

      // 3. Navigate to details form screen
      router.push({
        pathname: '/report/details',
        params: {
          imageUri: photo.uri,
          latitude: String(latitude),
          longitude: String(longitude),
          address,
        },
      });
      
    } catch (err) {
      console.error('Error during capture flow:', err);
      alert('Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state for permissions
  if (!cameraPermission || locationPermissionGranted === null) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  // Permissions missing UI
  if (!cameraPermission.granted || !locationPermissionGranted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center items-center">
        <View className="w-20 h-20 bg-rose-500/10 rounded-full items-center justify-center mb-6">
          <Ionicons name="lock-closed" size={36} color="#f43f5e" />
        </View>
        
        <Text className="text-2xl font-black text-white text-center leading-8">
          Permissions Required
        </Text>
        
        <Text className="text-sm text-slate-400 text-center mt-3 max-w-[280px] leading-5">
          CivicSnap needs access to your Camera to snap the issue and Location GPS coordinates to report it to city management.
        </Text>

        <AnimatedPressable
          onPress={handleRequestPermissions}
          className="mt-8 bg-sky-500 py-3.5 px-8 rounded-2xl shadow-lg shadow-sky-500/20"
        >
          <Text className="text-white font-extrabold text-sm">Grant Permissions</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.back()}
          className="mt-4 py-2 px-4"
        >
          <Text className="text-slate-500 font-bold text-xs">Back to Dashboard</Text>
        </AnimatedPressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} className="bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        ref={cameraRef}
        flash={flash}
      >
        {/* Fullscreen Overlay */}
        <SafeAreaView className="flex-1 justify-between px-4 py-6">
          {/* Top Bar Actions */}
          <View className="flex-row justify-between items-center">
            {/* Close Button */}
            <AnimatedPressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/45 border border-white/10 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="white" />
            </AnimatedPressable>

            {/* Title HUD */}
            <View className="bg-black/50 px-3 py-1.5 rounded-full border border-white/5">
              <Text className="text-white text-[10px] font-black tracking-widest uppercase">
                Capture Urban Issue
              </Text>
            </View>

            {/* Flash Button */}
            <AnimatedPressable
              onPress={handleToggleFlash}
              className="w-10 h-10 rounded-full bg-black/45 border border-white/10 items-center justify-center"
            >
              <Ionicons
                name={
                  flash === 'off'
                    ? 'flash-off'
                    : flash === 'on'
                    ? 'flash'
                    : 'flash-outline'
                }
                size={20}
                color={flash === 'on' ? '#f59e0b' : 'white'}
              />
            </AnimatedPressable>
          </View>

          {/* Grid Overlay Viewfinder */}
          <View style={styles.gridOverlay}>
            {/* Corner Markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            <View className="flex-1 justify-center items-center">
              <View className="w-12 h-12 rounded-full border border-dashed border-white/20 items-center justify-center">
                <View className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </View>
            </View>
          </View>

          {/* Bottom Bar: Capture Shutter */}
          <View className="items-center justify-center mb-4">
            {isProcessing ? (
              <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : (
              <AnimatedPressable
                onPress={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white bg-black/10 items-center justify-center p-1"
              >
                <View className="w-full h-full rounded-full bg-white shadow-md shadow-white/30" />
              </AnimatedPressable>
            )}
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridOverlay: {
    flex: 1,
    marginVertical: 40,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    justifyContent: 'space-between',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 18,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 18,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 18,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 18,
  },
});
