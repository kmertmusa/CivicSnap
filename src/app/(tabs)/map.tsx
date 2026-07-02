import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';
import { supabase } from '../../services/supabase';
import CityMapView from '../../components/CityMapView';
import IssueDetailModal from '../../components/IssueDetailModal';

export default function MapScreen() {
  const { profile, session } = useAuth();
  const isAuthority = profile?.role === 'authority';

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Inspection
  const [selectedReportForModal, setSelectedReportForModal] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (!session?.user || !isAuthority) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      if (data) {
        setReports(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching map coordinates from Supabase:', error);
      setLoading(false);
    }
  }, [isAuthority, session?.user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const updateStatus = async (reportId: string, newStatus: 'Pending' | 'In Progress' | 'Resolved') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw new Error(error.message);
      
      Alert.alert('Başarılı', `Bildirim durumu "${newStatus}" olarak güncellendi.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Hata', 'Durum güncellenirken hata oluştu.');
      setLoading(false);
    }
  };

  const handleCardPress = (report: any) => {
    setSelectedReportForModal(report);
    setModalVisible(true);
  };

  if (!isAuthority) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center items-center">
        <View className="w-16 h-16 bg-rose-500/10 rounded-full items-center justify-center mb-4">
          <Ionicons name="lock-closed" size={28} color="#f43f5e" />
        </View>
        <Text className="text-xl font-bold text-white text-center">Yetkisiz Erişim</Text>
        <Text className="text-sm text-slate-500 text-center mt-2 max-w-[240px]">
          Bu harita paneli sadece belediye kontrol yetkilileri tarafından görüntülenebilir.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 pt-2">
      {/* Header HUD */}
      <View className="mb-4 mt-4">
        <Text className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Şehir Radarı
        </Text>
        <Text className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
          Tüm aktif altyapı ihbarlarının coğrafi dağılımı
        </Text>
      </View>

      {/* Interactive Map Wrapper */}
      <View className="flex-1 mb-6">
        {loading && reports.length === 0 ? (
          <View className="flex-1 bg-slate-950 rounded-3xl items-center justify-center border border-slate-800">
            <ActivityIndicator size="large" color="#0284c7" />
          </View>
        ) : (
          <CityMapView 
            reports={reports} 
            onUpdateStatus={updateStatus}
            onCardPress={handleCardPress}
          />
        )}
      </View>
      <IssueDetailModal
        visible={modalVisible}
        report={selectedReportForModal}
        onClose={() => {
          setModalVisible(false);
          setSelectedReportForModal(null);
        }}
        onUpdateStatus={isAuthority ? updateStatus : undefined}
      />
    </SafeAreaView>
  );
}
