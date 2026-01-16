
import { User } from '../types';

/* 
   ==========================================================================
   PRODUCTION IMPLEMENTATION (SUPABASE)
   Uncomment this section and install @supabase/supabase-js to go live.
   ==========================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const AuthService = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata.name || 'User' } };
  },

  register: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } }
    });
    if (error) return { user: null, error: error.message };
    return { user: { id: data.user.id, email: data.user.email, name: name } };
  },

  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) return { user: null, error: error.message };
    // Note: OAuth redirects, so handling the return happens in App.tsx via supabase.auth.onAuthStateChange
    return { user: null }; 
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getCurrentSession: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
       return { 
         id: data.session.user.id, 
         email: data.session.user.email, 
         name: data.session.user.user_metadata.name || 'User' 
       };
    }
    return null;
  }
};
*/


// ==========================================================================
// CURRENT: MOCK IMPLEMENTATION (LOCAL STORAGE)
// Uses browser storage to simulate a database for the demo.
// ==========================================================================

const USERS_DB_KEY = 'pgos_users_db';

interface MockUserDB {
  id: string;
  email: string;
  passwordHash: string; // In real app, never store plain text
  name: string;
}

const getUsers = (): MockUserDB[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveUser = (user: MockUserDB) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const AuthService = {
  login: async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);

    if (found) {
      const user: User = { id: found.id, email: found.email, name: found.name, token: 'mock-jwt-token' };
      localStorage.setItem('pgos_current_session', JSON.stringify(user));
      return { user };
    }
    
    return { user: null, error: 'Invalid credentials.' };
  },

  register: async (email: string, password: string, name: string): Promise<{ user: User | null; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { user: null, error: 'User already exists.' };
    }

    if (password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters.' };
    }

    const newUser: MockUserDB = {
      id: `user_${Date.now()}`,
      email,
      passwordHash: password,
      name
    };

    saveUser(newUser);

    const user: User = { id: newUser.id, email: newUser.email, name: newUser.name, token: 'mock-jwt-token' };
    localStorage.setItem('pgos_current_session', JSON.stringify(user));
    
    return { user };
  },

  loginWithGoogle: async (): Promise<{ user: User | null; error?: string }> => {
    // Simulate OAuth Popup delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockGoogleUser = {
      id: 'google_user_demo',
      email: 'demo@gmail.com',
      name: 'Demo User', 
      token: 'mock-google-jwt'
    };

    // Ensure this mock user exists in our local DB so data persists
    const users = getUsers();
    if (!users.find(u => u.id === mockGoogleUser.id)) {
        saveUser({
            id: mockGoogleUser.id,
            email: mockGoogleUser.email,
            name: mockGoogleUser.name,
            passwordHash: 'google-oauth-placeholder'
        });
    }

    localStorage.setItem('pgos_current_session', JSON.stringify(mockGoogleUser));
    return { user: mockGoogleUser };
  },

  logout: async () => {
    localStorage.removeItem('pgos_current_session');
  },

  getCurrentSession: (): User | null => {
    try {
      const sess = localStorage.getItem('pgos_current_session');
      return sess ? JSON.parse(sess) : null;
    } catch {
      return null;
    }
  }
};
