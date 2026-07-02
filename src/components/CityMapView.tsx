import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from './AnimatedPressable';
import StatusBadge from './StatusBadge';

interface CityMapViewProps {
  reports: any[];
  onUpdateStatus?: (reportId: string, newStatus: 'Pending' | 'In Progress' | 'Resolved') => void;
  onCardPress?: (report: any) => void;
}

export default function CityMapView({ reports, onUpdateStatus, onCardPress }: CityMapViewProps) {
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Compute latitude/longitude boundaries to scale markers dynamically
  const bounds = useMemo(() => {
    if (reports.length === 0) return null;

    let latMin = Infinity;
    let latMax = -Infinity;
    let lngMin = Infinity;
    let lngMax = -Infinity;

    reports.forEach((r) => {
      const lat = parseFloat(r.latitude);
      const lng = parseFloat(r.longitude);
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
      if (lng < lngMin) lngMin = lng;
      if (lng > lngMax) lngMax = lng;
    });

    // Provide default bounds padding if coordinates are identical
    if (latMin === latMax) {
      latMin -= 0.005;
      latMax += 0.005;
    }
    if (lngMin === lngMax) {
      lngMin -= 0.005;
      lngMax += 0.005;
    }

    return { latMin, latMax, lngMin, lngMax };
  }, [reports]);

  // Translate coordinate locations to X/Y percentages on the map grid
  const getMarkerPosition = (latStr: string, lngStr: string) => {
    if (!bounds) return { left: '50%', top: '50%' };
    
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    const latRange = bounds.latMax - bounds.latMin || 1;
    const lngRange = bounds.lngMax - bounds.lngMin || 1;

    // Apply 12% safety padding inside the canvas edges
    const left = 12 + ((lng - bounds.lngMin) / lngRange) * 76;
    const top = 88 - ((lat - bounds.latMin) / latRange) * 76; // Invert Y coordinate

    return {
      left: `${left}%` as any,
      top: `${top}%` as any,
    };
  };

  const handleMarkerSelect = (report: any) => {
    setSelectedReport(report);
  };

  return (
    <View className="flex-1 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      
      {/* 1. Styled Tactical Vector Map Background */}
      <View className="absolute inset-0 bg-slate-950 opacity-40 flex-row flex-wrap justify-between p-4">
        {/* City Street Vector Lines */}
        <View className="absolute h-[1.5px] w-full bg-slate-900 top-1/4 left-0" />
        <View className="absolute h-[1.5px] w-full bg-slate-900 top-1/2 left-0" />
        <View className="absolute h-[1.5px] w-full bg-slate-900 top-3/4 left-0" />
        <View className="absolute w-[1.5px] h-full bg-slate-900 left-1/4 top-0" />
        <View className="absolute w-[1.5px] h-full bg-slate-900 left-1/2 top-0" />
        <View className="absolute w-[1.5px] h-full bg-slate-900 left-3/4 top-0" />

        {/* Intersecting Avenues */}
        <View className="absolute h-[6px] w-full bg-slate-900/60 top-[40%] left-0 border-y border-slate-800/40 justify-center items-center">
          <Text className="text-[7px] font-black text-slate-800 uppercase tracking-widest">Atatürk Bulvarı</Text>
        </View>
        <View className="absolute w-[6px] h-full bg-slate-900/60 left-[60%] top-0 border-x border-slate-800/40 justify-center items-center">
          {/* Vertical label spacer */}
        </View>

        {/* Central Park Block */}
        <View className="absolute w-24 h-24 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl top-[15%] left-[65%] items-center justify-center">
          <Ionicons name="leaf-outline" size={16} color="#065f46" />
          <Text className="text-[6px] font-extrabold text-emerald-800 uppercase tracking-widest mt-1">Merkez Parkı</Text>
        </View>

        {/* Industrial Zone Block */}
        <View className="absolute w-28 h-20 bg-purple-950/15 border border-purple-900/30 rounded-2xl bottom-[12%] left-[10%] items-center justify-center">
          <Ionicons name="construct-outline" size={16} color="#581c87" />
          <Text className="text-[6px] font-extrabold text-purple-900 uppercase tracking-widest mt-1">Sanayi Bölgesi</Text>
        </View>
      </View>

      {/* Grid Coordinates Indicators */}
      <View className="absolute top-3 left-3 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
        <Text className="text-[8px] font-black text-sky-500 uppercase tracking-wider">
          TACTICAL RADAR VIEW
        </Text>
      </View>

      {/* 2. Plotting Markers */}
      {reports.map((report) => {
        const isSelected = selectedReport?.id === report.id;
        const pos = getMarkerPosition(report.latitude, report.longitude);
        
        let markerBg = 'bg-amber-500 shadow-amber-500/50';
        if (report.status === 'In Progress') markerBg = 'bg-sky-500 shadow-sky-500/50';
        if (report.status === 'Resolved') markerBg = 'bg-emerald-500 shadow-emerald-500/50';

        return (
          <View
            key={report.id}
            style={{ 
              position: 'absolute', 
              left: pos.left, 
              top: pos.top, 
              transform: [{ translateX: -12 }, { translateY: -12 }] 
            }}
          >
            <AnimatedPressable
              onPress={() => handleMarkerSelect(report)}
              className={`w-6 h-6 rounded-full items-center justify-center ${isSelected ? 'scale-125 border-2 border-white' : ''}`}
            >
              {/* Outer Pulse */}
              <View className={`absolute inset-0.5 rounded-full opacity-35 ${markerBg} animate-ping`} />
              
              {/* Inner Circle Pin */}
              <View className={`w-3.5 h-3.5 rounded-full shadow-md ${markerBg}`} />
            </AnimatedPressable>
          </View>
        );
      })}

      {reports.length === 0 && (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="navigate-outline" size={32} color="#475569" />
          <Text className="text-slate-400 font-bold text-sm mt-3 text-center">
            Haritada gösterilecek aktif şikayet bulunamadı.
          </Text>
        </View>
      )}

      {/* 3. Sliding Bottom-Sheet Card */}
      {selectedReport && (
        <View className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 rounded-3xl p-3.5 shadow-2xl flex-row items-center">
          {/* Miniature Thumbnail */}
          <Image
            source={{ uri: selectedReport.image_url }}
            style={{ width: 72, height: 72, borderRadius: 16 }}
            contentFit="cover"
            className="bg-slate-850 mr-3"
          />

          {/* Issue summary details */}
          <View className="flex-1 justify-between h-[72px]">
            <View className="flex-row justify-between items-center pr-6">
              <Text className="text-sm font-bold text-white flex-1 mr-1" numberOfLines={1}>
                {selectedReport.issue_type}
              </Text>
              <Text className="text-[8px] font-black text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded uppercase">
                {selectedReport.severity}
              </Text>
            </View>

            <Text className="text-[10px] text-slate-400 font-medium leading-4" numberOfLines={2}>
              {selectedReport.description}
            </Text>

            {/* Actions Footer */}
            <View className="flex-row justify-between items-center mt-1 pr-6">
              <Text className="text-[8px] text-slate-500 font-bold" numberOfLines={1}>
                📍 {selectedReport.address || `${parseFloat(selectedReport.latitude).toFixed(4)}, ${parseFloat(selectedReport.longitude).toFixed(4)}`}
              </Text>
              
              <View className="flex-row items-center">
                {/* Manage Action Trigger */}
                <AnimatedPressable
                  onPress={() => onCardPress?.(selectedReport)}
                  className="bg-purple-600 px-2 py-1 rounded-lg mr-1.5 shadow-sm"
                >
                  <Text className="text-white text-[8px] font-bold">Durum Güncelle</Text>
                </AnimatedPressable>
                
                <StatusBadge status={selectedReport.status} />
              </View>
            </View>
          </View>

          {/* Close Panel Button */}
          <AnimatedPressable
            onPress={() => setSelectedReport(null)}
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-800 items-center justify-center"
          >
            <Ionicons name="close" size={14} color="#94a3b8" />
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}
