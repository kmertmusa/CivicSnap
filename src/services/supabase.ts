import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Synchronous state to route queries dynamically at runtime
let isMockActive = true;

// Load saved mock mode synchronously as early as possible
AsyncStorage.getItem('civicsnap_mock_mode').then((val) => {
  if (val !== null) {
    isMockActive = JSON.parse(val);
  } else {
    isMockActive = true; // default to true
  }
}).catch(() => {
  isMockActive = true;
});

/**
 * Update active mock state from Settings in real-time
 */
export function setSupabaseMockActive(enabled: boolean) {
  isMockActive = enabled;
  console.log(`Supabase Service: Dynamic Routing updated. Mock Mode is now ${enabled ? 'ACTIVE' : 'INACTIVE'}`);
}

// ----------------------------------------------------
// 1. Real Supabase Client Configuration
// ----------------------------------------------------
let realSupabase: any = null;

const isServer = typeof window === 'undefined';

const supabaseStorage = {
  getItem: async (key: string) => {
    if (isServer) return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string) => {
    if (isServer) return;
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

if (isSupabaseConfigured) {
  console.log('Supabase Service: Real Supabase client pre-configured.');
  realSupabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

// ----------------------------------------------------
// 2. Local Mock Supabase Client Configuration
// ----------------------------------------------------
const MOCK_USERS_KEY = 'civicsnap_mock_users';
const MOCK_PROFILES_KEY = 'civicsnap_mock_profiles';
const MOCK_REPORTS_KEY = 'civicsnap_mock_reports';
const MOCK_SESSION_KEY = 'civicsnap_mock_session';

const getMockData = async (key: string): Promise<any[]> => {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

const saveMockData = async (key: string, data: any[]): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(data));
};

const getMockSession = async (): Promise<any | null> => {
  const raw = await AsyncStorage.getItem(MOCK_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
};

const saveMockSession = async (session: any | null): Promise<void> => {
  if (session) {
    await AsyncStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(MOCK_SESSION_KEY);
  }
};

const authListeners: ((event: string, session: any) => void)[] = [];

const notifyAuthListeners = (event: string, session: any) => {
  authListeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (err) {
      console.error('Error notifying auth listener:', err);
    }
  });
};

class MockQueryBuilder {
  private table: string;
  private filters: { col: string; val: any }[] = [];
  private sortCol: string | null = null;
  private sortAsc: boolean = true;
  private isSingle: boolean = false;
  private isInsert: boolean = false;
  private isUpdate: boolean = false;
  private inputData: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    return this;
  }

  insert(data: any[]) {
    this.isInsert = true;
    this.inputData = data;
    return this;
  }

  update(data: any) {
    this.isUpdate = true;
    this.inputData = data;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, { ascending = true } = {}) {
    this.sortCol = col;
    this.sortAsc = ascending;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: any) {
    try {
      const storageKey =
        this.table === 'profiles'
          ? MOCK_PROFILES_KEY
          : this.table === 'reports'
          ? MOCK_REPORTS_KEY
          : 'civicsnap_mock_' + this.table;

      let records = await getMockData(storageKey);

      if (this.isInsert && Array.isArray(this.inputData)) {
        const inserted = this.inputData.map((item) => ({
          id: item.id || Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          ...item,
        }));
        records = [...inserted, ...records];
        await saveMockData(storageKey, records);
        return resolve({ data: this.isSingle ? inserted[0] : inserted, error: null });
      }

      if (this.isUpdate && this.inputData) {
        records = records.map((record) => {
          let matches = true;
          this.filters.forEach((filter) => {
            if (record[filter.col] !== filter.val) matches = false;
          });
          if (matches) {
            return { ...record, ...this.inputData, updated_at: new Date().toISOString() };
          }
          return record;
        });
        await saveMockData(storageKey, records);
        
        const updated = records.filter((record) => {
          let matches = true;
          this.filters.forEach((filter) => {
            if (record[filter.col] !== filter.val) matches = false;
          });
          return matches;
        });

        return resolve({ data: this.isSingle ? updated[0] : updated, error: null });
      }

      let filtered = [...records];
      if (this.filters.length > 0) {
        filtered = filtered.filter((record) => {
          return this.filters.every((filter) => record[filter.col] === filter.val);
        });
      }

      if (this.sortCol) {
        const colName = this.sortCol;
        filtered.sort((a, b) => {
          const valA = a[colName];
          const valB = b[colName];
          if (valA < valB) return this.sortAsc ? -1 : 1;
          if (valA > valB) return this.sortAsc ? 1 : -1;
          return 0;
        });
      }

      if (this.isSingle) {
        return resolve({ data: filtered[0] || null, error: filtered[0] ? null : { message: 'Row not found' } });
      }

      return resolve({ data: filtered, error: null });
    } catch (err: any) {
      return resolve({ data: null, error: { message: err.message || 'Mock database error' } });
    }
  }
}

const mockSupabase = {
  auth: {
    async signUp({ email, password, options }: any) {
      try {
        const users = await getMockData(MOCK_USERS_KEY);
        if (users.some((u) => u.email === email)) {
          return { data: { user: null }, error: { message: 'Kullanıcı zaten mevcut' } };
        }

        const mockUserId = Math.random().toString(36).substring(2, 15);
        const newUser = { id: mockUserId, email, password };
        await saveMockData(MOCK_USERS_KEY, [...users, newUser]);

        const role = options?.data?.role || 'citizen';
        const profiles = await getMockData(MOCK_PROFILES_KEY);
        const newProfile = { id: mockUserId, email, role, updated_at: new Date().toISOString() };
        await saveMockData(MOCK_PROFILES_KEY, [...profiles, newProfile]);

        const session = {
          user: { id: mockUserId, email },
          access_token: 'mock_jwt_token',
        };
        await saveMockSession(session);
        notifyAuthListeners('SIGNED_IN', session);

        return { data: { user: session.user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    },

    async signInWithPassword({ email, password }: any) {
      try {
        const users = await getMockData(MOCK_USERS_KEY);
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
          return { data: { session: null }, error: { message: 'E-posta veya şifre hatalı.' } };
        }

        const session = {
          user: { id: user.id, email: user.email },
          access_token: 'mock_jwt_token',
        };
        await saveMockSession(session);
        notifyAuthListeners('SIGNED_IN', session);

        return { data: { session, user: session.user }, error: null };
      } catch (err: any) {
        return { data: { session: null }, error: { message: err.message } };
      }
    },

    async signOut() {
      await saveMockSession(null);
      notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    async getSession() {
      const session = await getMockSession();
      return { data: { session }, error: null };
    },

    onAuthStateChange(callback: any) {
      authListeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = authListeners.indexOf(callback);
              if (idx > -1) authListeners.splice(idx, 1);
            },
          },
        },
      };
    },
  },

  from(table: string) {
    return new MockQueryBuilder(table);
  },
};

// ----------------------------------------------------
// 3. Exported Dynamic Proxy Client
// ----------------------------------------------------
export const supabase = {
  get auth() {
    const useMock = isMockActive || !isSupabaseConfigured;
    return useMock ? mockSupabase.auth : realSupabase.auth;
  },
  from(table: string) {
    const useMock = isMockActive || !isSupabaseConfigured;
    return useMock ? mockSupabase.from(table) : realSupabase.from(table);
  },
  get storage() {
    const useMock = isMockActive || !isSupabaseConfigured;
    return useMock ? null : realSupabase.storage;
  }
};
