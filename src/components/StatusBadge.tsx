import React from 'react';
import { View, Text } from 'react-native';

interface StatusBadgeProps {
  status: 'Pending' | 'In Progress' | 'Resolved';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let containerClasses = '';
  let dotClasses = '';
  let textClasses = '';

  switch (status) {
    case 'Pending':
      containerClasses = 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20';
      dotClasses = 'bg-amber-500';
      textClasses = 'text-amber-800 dark:text-amber-400';
      break;
    case 'In Progress':
      containerClasses = 'bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20';
      dotClasses = 'bg-sky-500';
      textClasses = 'text-sky-800 dark:text-sky-400';
      break;
    case 'Resolved':
      containerClasses = 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20';
      dotClasses = 'bg-emerald-500';
      textClasses = 'text-emerald-800 dark:text-emerald-400';
      break;
  }

  return (
    <View className={`flex-row items-center px-2.5 py-1 rounded-full self-start ${containerClasses}`}>
      <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClasses}`} />
      <Text className={`text-xs font-semibold ${textClasses}`}>
        {status}
      </Text>
    </View>
  );
}
