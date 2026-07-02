import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // 1. Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).L) {
        setLeafletLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Clean up previous map instance if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Compute map center point coordinates (defaults to Istanbul)
    let centerLat = 41.0082;
    let centerLng = 28.9784;

    if (reports.length > 0) {
      let latSum = 0;
      let lngSum = 0;
      let validCount = 0;
      reports.forEach((r) => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          latSum += lat;
          lngSum += lng;
          validCount++;
        }
      });
      if (validCount > 0) {
        centerLat = latSum / validCount;
        centerLng = lngSum / validCount;
      }
    }

    // Initialize Leaflet Map
    const map = L.map(containerRef.current).setView([centerLat, centerLng], 13);
    mapRef.current = map;

    // Add Tile Layer from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Plot markers
    reports.forEach((report) => {
      const lat = parseFloat(report.latitude);
      const lng = parseFloat(report.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      // Pin Color matching badge themes
      let markerColor = '#f59e0b'; // Pending: Amber
      if (report.status === 'In Progress') markerColor = '#0ea5e9'; // In Progress: Blue
      if (report.status === 'Resolved') markerColor = '#10b981'; // Resolved: Green

      // Custom Glowing DivIcon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            background-color: ${markerColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 12px ${markerColor}aa;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // On click, show our custom animated sliding bottom drawer
      marker.on('click', () => {
        setSelectedReport(report);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, reports]);

  return (
    <View style={styles.container}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden' }} 
      />

      {!leafletLoaded && (
        <View style={StyleSheet.absoluteFill} className="bg-slate-950 items-center justify-center rounded-3xl">
          <Text className="text-white font-bold text-sm">Harita Yükleniyor...</Text>
        </View>
      )}

      {reports.length === 0 && leafletLoaded && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
          <View className="bg-slate-900/90 px-6 py-4 rounded-2xl border border-slate-800">
            <Text className="text-slate-300 font-bold text-sm text-center">
              📍 Haritada gösterilecek aktif ihbar bulunamadı.
            </Text>
          </View>
        </View>
      )}

      {/* Selected marker summary slider */}
      {selectedReport && (
        <View className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 rounded-3xl p-3.5 shadow-2xl flex-row items-center">
          <Image
            source={{ uri: selectedReport.image_url }}
            style={{ width: 72, height: 72, borderRadius: 16 }}
            contentFit="cover"
            className="bg-slate-850 mr-3"
          />

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

            <View className="flex-row justify-between items-center mt-1 pr-6">
              <Text className="text-[8px] text-slate-500 font-bold" numberOfLines={1}>
                📍 {selectedReport.address || `${parseFloat(selectedReport.latitude).toFixed(4)}, ${parseFloat(selectedReport.longitude).toFixed(4)}`}
              </Text>
              
              <View className="flex-row items-center">
                <AnimatedPressable
                  onPress={() => {
                    onCardPress?.(selectedReport);
                    setSelectedReport(null); // Clear map card on opening action modal
                  }}
                  className="bg-purple-600 px-2.5 py-1 rounded-lg mr-1.5 shadow-sm"
                >
                  <Text className="text-white text-[8px] font-bold">Değerlendir</Text>
                </AnimatedPressable>
                
                <StatusBadge status={selectedReport.status} />
              </View>
            </View>
          </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
});
