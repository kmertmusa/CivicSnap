import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSupabaseMockActive } from './supabase';

const API_KEY_STORAGE_KEY = 'civicsnap_gemini_api_key';
const REPORTS_STORAGE_KEY = 'civicsnap_reports_list';
const MOCK_MODE_STORAGE_KEY = 'civicsnap_mock_mode';

export interface Report {
  id: string;
  imageUri: string;
  issueType: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
}

let isSecureStoreAvailable: boolean | null = null;

async function checkSecureStore(): Promise<boolean> {
  if (isSecureStoreAvailable !== null) return isSecureStoreAvailable;
  try {
    isSecureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    isSecureStoreAvailable = false;
  }
  return isSecureStoreAvailable;
}

/**
 * Save Gemini API Key securely (or fallback to AsyncStorage on Web)
 */
export async function saveApiKey(key: string): Promise<void> {
  try {
    const secure = await checkSecureStore();
    if (secure) {
      await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
    } else {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
    }
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
}

/**
 * Get Gemini API Key from secure storage (or fallback to AsyncStorage on Web)
 */
export async function getApiKey(): Promise<string | null> {
  try {
    const secure = await checkSecureStore();
    if (secure) {
      return await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
    } else {
      return await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

/**
 * Delete Gemini API Key from secure storage (or fallback to AsyncStorage on Web)
 */
export async function deleteApiKey(): Promise<void> {
  try {
    const secure = await checkSecureStore();
    if (secure) {
      await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
    } else {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error deleting API key:', error);
  }
}

/**
 * Save mock mode preference
 */
export async function setMockMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(MOCK_MODE_STORAGE_KEY, JSON.stringify(enabled));
    setSupabaseMockActive(enabled);
  } catch (error) {
    console.error('Error saving mock mode preference:', error);
  }
}

/**
 * Get mock mode preference (defaults to true for easy testing out-of-the-box)
 */
export async function getMockMode(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(MOCK_MODE_STORAGE_KEY);
    return value !== null ? JSON.parse(value) : true;
  } catch (error) {
    console.error('Error getting mock mode preference:', error);
    return true;
  }
}

/**
 * Fetch all saved issue reports
 */
export async function getReports(): Promise<Report[]> {
  try {
    const data = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
    if (!data) return [];
    
    const reports: Report[] = JSON.parse(data);
    // Sort by timestamp descending (newest first)
    return reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error getting reports:', error);
    return [];
  }
}

/**
 * Save a new issue report
 */
export async function saveReport(report: Report): Promise<void> {
  try {
    const existing = await getReports();
    const updated = [report, ...existing];
    await AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
}

/**
 * Update the status of an existing report
 */
export async function updateReportStatus(reportId: string, status: 'Pending' | 'In Progress' | 'Resolved'): Promise<void> {
  try {
    const existing = await getReports();
    const updated = existing.map((r) => (r.id === reportId ? { ...r, status } : r));
    await AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}

/**
 * Clear all report history
 */
export async function clearReports(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REPORTS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing reports:', error);
  }
}
