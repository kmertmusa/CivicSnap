import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Request foreground location permissions from the user
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get current user location coordinates and address string
 */
export async function fetchCurrentLocation(): Promise<LocationData> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;
    
    // Attempt reverse geocoding to get a clean address
    let address = undefined;
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const street = item.street || item.name || '';
        const district = item.district || '';
        const city = item.city || item.subregion || '';
        
        const parts = [street, district, city].filter(p => p.trim() !== '');
        address = parts.join(', ') || undefined;
      }
    } catch (geoError) {
      console.warn('Reverse geocoding failed, falling back to coordinates name:', geoError);
    }

    return {
      latitude,
      longitude,
      address,
    };
  } catch (error) {
    console.error('Error fetching current location:', error);
    throw error;
  }
}
