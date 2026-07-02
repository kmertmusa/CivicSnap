import React from 'react';
import { View, Text, Modal, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from './AnimatedPressable';
import StatusBadge from './StatusBadge';

interface IssueDetailModalProps {
  visible: boolean;
  report: any;
  onClose: () => void;
  onUpdateStatus?: (reportId: string, status: 'Pending' | 'In Progress' | 'Resolved') => void;
}

export default function IssueDetailModal({ visible, report, onClose, onUpdateStatus }: IssueDetailModalProps) {
  if (!report) return null;

  const formattedDate = report.created_at 
    ? new Date(report.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const handleStatusChange = (newStatus: 'Pending' | 'In Progress' | 'Resolved') => {
    if (onUpdateStatus) {
      onUpdateStatus(report.id, newStatus);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-slate-950/75">
        {/* Click outside to close (Optional overlay) */}
        <AnimatedPressable 
          onPress={onClose} 
          className="absolute inset-0"
        />

        {/* Modal Drawer Sheet */}
        <View className="bg-white dark:bg-neutral-900 border-t border-slate-200/50 dark:border-neutral-800 rounded-t-3xl max-h-[85%] shadow-2xl relative">
          
          {/* Drawer Handle */}
          <View className="w-12 h-1 bg-slate-200 dark:bg-neutral-800 rounded-full self-center my-3" />

          {/* Close Button */}
          <AnimatedPressable
            onPress={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 items-center justify-center z-10"
          >
            <Ionicons name="close" size={20} className="text-slate-600 dark:text-slate-350" />
          </AnimatedPressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} className="px-5">
            {/* Header / Title */}
            <View className="mb-4 pr-10">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                İHBAR DETAYI & DEĞERLENDİRME
              </Text>
              <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-8">
                {report.issue_type}
              </Text>
            </View>

            {/* Badges Info Row */}
            <View className="flex-row items-center space-x-3 mb-5 flex-wrap">
              <StatusBadge status={report.status} />
              
              <View className="bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 ml-2">
                <Text className="text-[10px] font-extrabold text-rose-500 tracking-wider">
                  ⚠️ {report.severity.toUpperCase()}
                </Text>
              </View>

              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-3">
                {formattedDate}
              </Text>
            </View>

            {/* Large Image Preview */}
            <View className="mb-6 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/60 shadow-inner">
              <Image
                source={{ uri: report.image_url }}
                style={{ width: '100%', height: 240 }}
                contentFit="cover"
              />
            </View>

            {/* Description Card */}
            <View className="mb-6 bg-slate-50 dark:bg-neutral-950/40 border border-slate-100 dark:border-neutral-850 p-4 rounded-2xl">
              <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Açıklama / Hasar Detayları
              </Text>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-6">
                {report.description}
              </Text>
            </View>

            {/* Location & Coordinates Info */}
            <View className="mb-6 bg-slate-50 dark:bg-neutral-950/40 border border-slate-100 dark:border-neutral-850 p-4 rounded-2xl">
              <View className="flex-row items-center mb-2">
                <Ionicons name="location" size={16} className="text-sky-500 mr-2" />
                <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Konum Bilgisi
                </Text>
              </View>
              
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-6">
                {report.address || 'Adres bilgisi alınamadı'}
              </Text>
              
              <Text className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-6">
                Enlem: {parseFloat(report.latitude).toFixed(6)} | Boylam: {parseFloat(report.longitude).toFixed(6)}
              </Text>
            </View>

            {/* 4. Action Decision Dashboard (Only for Authorities) */}
            <View className="mt-2 border-t border-slate-150 dark:border-neutral-800 pt-5">
              <Text className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                YETKİLİ DEĞERLENDİRME EYLEMLERİ
              </Text>

              <View className="flex-row space-x-3">
                {/* 1. In Progress button */}
                {report.status !== 'In Progress' && (
                  <AnimatedPressable
                    onPress={() => handleStatusChange('In Progress')}
                    className="flex-1 py-3.5 bg-sky-600 dark:bg-sky-500 rounded-2xl items-center justify-center flex-row shadow-lg shadow-sky-500/10 mr-2"
                  >
                    <Ionicons name="play" size={16} color="white" className="mr-1.5" />
                    <Text className="text-white text-xs font-bold ml-1">İşleme Al</Text>
                  </AnimatedPressable>
                )}

                {/* 2. Resolved button (Tamamla) */}
                {report.status !== 'Resolved' && (
                  <AnimatedPressable
                    onPress={() => handleStatusChange('Resolved')}
                    className="flex-1 py-3.5 bg-emerald-600 dark:bg-emerald-500 rounded-2xl items-center justify-center flex-row shadow-lg shadow-emerald-500/10 mr-2"
                  >
                    <Ionicons name="checkmark-circle" size={16} color="white" className="mr-1.5" />
                    <Text className="text-white text-xs font-bold ml-1">Çözüldü / Tamamlandı</Text>
                  </AnimatedPressable>
                )}

                {/* 3. Pending button (Beklet) */}
                {report.status !== 'Pending' && (
                  <AnimatedPressable
                    onPress={() => handleStatusChange('Pending')}
                    className="flex-1 py-3.5 bg-amber-500 dark:bg-amber-400 rounded-2xl items-center justify-center flex-row shadow-lg shadow-amber-500/10"
                  >
                    <Ionicons name="pause" size={16} color="white" className="mr-1.5" />
                    <Text className="text-white text-xs font-bold ml-1">Beklemeye Al</Text>
                  </AnimatedPressable>
                )}
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
