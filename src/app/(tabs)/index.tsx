import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';
import { supabase } from '../../services/supabase';
import IssueCard from '../../components/IssueCard';
import AnimatedPressable from '../../components/AnimatedPressable';
import IssueDetailModal from '../../components/IssueDetailModal';

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export default function DashboardScreen() {
  const { profile, session } = useAuth();
  const isAuthority = profile?.role === 'authority';

  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Filters for Authority View
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved'>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

  // Modal State for Inspection
  const [selectedReportForModal, setSelectedReportForModal] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load and refresh reports from Supabase (Real or Mock)
  const loadData = useCallback(async () => {
    try {
      if (!session?.user) return;
      
      let query = supabase.from('reports').select('*');

      // Citizens only see their own reports. Authorities see all city-wide reports.
      if (!isAuthority) {
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      if (data) {
        setReports(data);
        
        // Calculate cumulative metrics
        const newStats = data.reduce(
          (acc: Stats, report: any) => {
            acc.total += 1;
            if (report.status === 'Pending') acc.pending += 1;
            else if (report.status === 'In Progress') acc.inProgress += 1;
            else if (report.status === 'Resolved') acc.resolved += 1;
            return acc;
          },
          { total: 0, pending: 0, inProgress: 0, resolved: 0 }
        );
        setStats(newStats);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard reports from Supabase:', error);
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
      
      Alert.alert('Güncellendi', `Durum başarıyla "${newStatus}" olarak değiştirildi.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Hata', 'Durum güncellenirken bir sorun oluştu.');
      setLoading(false);
    }
  };

  const handleCardPress = (report: any) => {
    const rawReport = filteredData.find((r) => r.id === report.id);
    if (rawReport) {
      setSelectedReportForModal(rawReport);
      setModalVisible(true);
    }
  };

  const getFilteredReports = () => {
    return reports.filter((item) => {
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchSeverity = severityFilter === 'All' || item.severity === severityFilter;
      return matchStatus && matchSeverity;
    });
  };

  const renderHeader = () => (
    <View className="mb-4 mt-4">
      {/* Welcome Title */}
      <View className="mb-6 flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            CivicSnap
          </Text>
          <Text className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            {isAuthority ? 'Belediye Yetkili Paneli (Bütün Şehir)' : 'Vatandaş Bildirim Paneli (Benim Kayıtlarım)'}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full items-center justify-center ${isAuthority ? 'bg-purple-100 dark:bg-purple-500/10' : 'bg-sky-100 dark:bg-sky-500/10'}`}>
          <Text className={`text-[10px] font-black uppercase ${isAuthority ? 'text-purple-600 dark:text-purple-400' : 'text-sky-600 dark:text-sky-400'}`}>
            {profile?.role}
          </Text>
        </View>
      </View>

      {/* Stats Summary Container */}
      <View className="flex-row justify-between mb-4">
        {/* Total Capsule */}
        <View className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-3 rounded-2xl mr-2 items-center shadow-xs">
          <Text className="text-xl font-black text-slate-800 dark:text-slate-200">{stats.total}</Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Toplam</Text>
        </View>

        {/* Pending Capsule */}
        <View className="flex-1 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/40 dark:border-amber-500/10 p-3 rounded-2xl mr-2 items-center shadow-xs">
          <Text className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-amber-500/70 dark:text-amber-500/60 mt-0.5">Bekleyen</Text>
        </View>

        {/* In Progress Capsule */}
        <View className="flex-1 bg-sky-50/50 dark:bg-sky-500/5 border border-sky-200/40 dark:border-sky-500/10 p-3 rounded-2xl mr-2 items-center shadow-xs">
          <Text className="text-xl font-black text-sky-600 dark:text-sky-400">{stats.inProgress}</Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-sky-500/70 dark:text-sky-500/60 mt-0.5">İşlemde</Text>
        </View>

        {/* Resolved Capsule */}
        <View className="flex-1 bg-emerald-50/55 dark:bg-emerald-500/5 border border-emerald-200/40 dark:border-emerald-500/10 p-3 rounded-2xl items-center shadow-xs">
          <Text className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.resolved}</Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70 dark:text-emerald-500/60 mt-0.5">Çözüldü</Text>
        </View>
      </View>

      {/* Filters HUD (Only visible to Authority) */}
      {isAuthority && (
        <View className="bg-slate-100/50 dark:bg-neutral-900 border border-slate-200/40 dark:border-neutral-800 rounded-3xl p-4 mb-2">
          {/* Status Filter Row */}
          <Text className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">İşlem Durumu</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
            {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map((stat) => (
              <AnimatedPressable
                key={stat}
                onPress={() => setStatusFilter(stat)}
                className={`px-3 py-1.5 rounded-full border border-slate-200/30 dark:border-neutral-800 mr-2 ${statusFilter === stat ? 'bg-purple-600 border-purple-600' : 'bg-white dark:bg-slate-950'}`}
              >
                <Text className={`text-[10px] font-bold ${statusFilter === stat ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {stat === 'All' ? 'Tümü' : stat}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>

          {/* Severity Filter Row */}
          <Text className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Önem Derecesi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {(['All', 'Low', 'Medium', 'High'] as const).map((sev) => (
              <AnimatedPressable
                key={sev}
                onPress={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-full border border-slate-200/30 dark:border-neutral-800 mr-2 ${severityFilter === sev ? 'bg-purple-600 border-purple-600' : 'bg-white dark:bg-slate-950'}`}
              >
                <Text className={`text-[10px] font-bold ${severityFilter === sev ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {sev === 'All' ? 'Tümü' : sev}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 py-16 px-6 items-center justify-center bg-slate-50/50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl mt-2">
      <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full items-center justify-center mb-4">
        <Ionicons name="sparkles-outline" size={28} color="#94a3b8" />
      </View>
      <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 text-center">
        Kayıt Bulunamadı
      </Text>
      <Text className="text-sm text-slate-400 dark:text-slate-500 text-center mt-2 max-w-[240px] leading-5 font-semibold">
        {isAuthority 
          ? 'Belirtilen filtrelere uyan herhangi bir belediye altyapı şikayeti bulunamadı.'
          : 'Henüz bir altyapı bildirimi oluşturmadınız. Şikayette bulunmak için aşağıdaki butonu kullanın!'}
      </Text>
      
      {!isAuthority && (
        <AnimatedPressable
          onPress={() => router.push('/report/camera')}
          className="mt-6 bg-sky-600 dark:bg-sky-500 px-5 py-2.5 rounded-xl shadow-md shadow-sky-500/20 flex-row items-center"
        >
          <Ionicons name="camera" size={18} color="white" className="mr-2" />
          <Text className="text-white font-bold text-sm">İlk Sorunu Çek</Text>
        </AnimatedPressable>
      )}
    </View>
  );

  if (loading && reports.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </SafeAreaView>
    );
  }

  const filteredData = getFilteredReports();

  // Unified schema mappings: convert database snake_case keys (Supabase) to frontend camelCase keys (used by IssueCard)
  const normalizedReports = filteredData.map((item: any) => ({
    id: item.id,
    imageUri: item.image_url,
    issueType: item.issue_type,
    severity: item.severity,
    description: item.description,
    latitude: parseFloat(item.latitude),
    longitude: parseFloat(item.longitude),
    address: item.address,
    timestamp: item.created_at,
    status: item.status,
  }));

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 pt-2">
      <FlatList
        data={normalizedReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IssueCard 
            report={item} 
            onPress={() => handleCardPress(item)} 
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadData}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Action Button (FAB) - Only shown to Citizens */}
      {!isAuthority && (
        <View className="absolute bottom-6 right-6">
          <AnimatedPressable
            onPress={() => router.push('/report/camera')}
            className="bg-sky-600 dark:bg-sky-500 w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-sky-500/35 border border-sky-500/10 dark:border-sky-400/20"
          >
            <Ionicons name="add" size={32} color="white" />
          </AnimatedPressable>
        </View>
      )}

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
