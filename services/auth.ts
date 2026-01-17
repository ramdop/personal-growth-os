
import { User } from '../types';

// ==========================================================================
// PRODUCTION IMPLEMENTATION (SUPABASE)
// ==========================================================================

import { supabase } from './supabase';

export const AuthService = {
  login: async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: "No user returned" };

    return { user: { id: data.user.id, email: data.user.email || '', name: data.user.user_metadata.name || 'User' } };
  },

  register: async (email: string, password: string, name: string): Promise<{ user: User | null; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } }
    });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: "No user returned" };

    return { user: { id: data.user.id, email: data.user.email || '', name: name } };
  },

  loginWithGoogle: async (): Promise<{ user: User | null; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/calendar',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    if (error) return { user: null, error: error.message };
    return { user: null }; // OAuth redirects
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.clear(); // Force clear all local data/tokens
  },

  getCurrentSession: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      return {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: data.session.user.user_metadata.name || 'User'
      };
    }
    return null;
  }
};


// ==========================================================================
// MOCK IMPLEMENTATION (LOCAL STORAGE)
// Disabled for production.
// ==========================================================================

// const USERS_DB_KEY = 'pgos_users_db';
// ... (Mock implementation hidden)

