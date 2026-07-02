import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Report } from '../services/storage';
import { useAuth } from '../context/auth';
import StatusBadge from './StatusBadge';
import AnimatedPressable from './AnimatedPressable';

interface IssueCardProps {
  report: Report;
  onPress?: () => void;
}

export default function IssueCard({ report, onPress }: IssueCardProps) {
  const { profile } = useAuth();
  const isAuthority = profile?.role === 'authority';

  const formattedDate = new Date(report.timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let severityClasses = '';
  switch (report.severity) {
    case 'Low':
      severityClasses = 'text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded';
      break;
    case 'Medium':
      severityClasses = 'text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded';
      break;
    case 'High':
      severityClasses = 'text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded';
      break;
  }

  const locationText = report.address || `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`;

  return (
    <AnimatedPressable
      onPress={onPress}
      className="bg-white dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-3.5 mb-4 shadow-sm shadow-neutral-100 dark:shadow-none flex-row items-center"
    >
      {/* Thumbnail Image */}
      <Image
        source={{ uri: report.imageUri }}
        style={{ width: 84, height: 84, borderRadius: 14 }}
        contentFit="cover"
        className="bg-neutral-100 dark:bg-neutral-800/60 mr-4"
      />

      {/* Details Container */}
      <View className="flex-1 justify-between h-[84px]">
        {/* Header: Title/Type and Severity */}
        <View className="flex-row justify-between items-center">
          <Text 
            className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex-1 mr-2" 
            numberOfLines={1}
          >
            {report.issueType}
          </Text>
          <Text className={`text-[10px] font-bold uppercase tracking-wide ${severityClasses}`}>
            {report.severity}
          </Text>
        </View>

        {/* Description text */}
        <Text 
          className="text-xs text-neutral-500 dark:text-neutral-400 font-medium" 
          numberOfLines={2}
        >
          {report.description}
        </Text>

        {/* Footer: Date and Location / Status */}
        <View className="flex-row justify-between items-center mt-1">
          <View className="flex-1 mr-2">
            <Text className="text-[9px] text-neutral-400 dark:text-neutral-500 font-semibold" numberOfLines={1}>
              📍 {locationText}
            </Text>
            <Text className="text-[9px] text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
              {formattedDate}
            </Text>
          </View>
          <View className="flex-row items-center">
            <StatusBadge status={report.status} />
            {isAuthority && (
              <Ionicons name="create-outline" size={14} color="#a855f7" style={{ marginLeft: 6 }} />
            )}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}
