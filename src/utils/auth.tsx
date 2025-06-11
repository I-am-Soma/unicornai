
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
  provider?: string;
}

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Supabase login error:', error.message);
    throw new Error(error.message);
  }

  const sessionUser = data.user;
  const user: User = {
    id: sessionUser.id,
    email: sessionUser.email || '',
    name: sessionUser.user_metadata?.name || '',
    avatar: sessionUser.user_metadata?.avatar_url || '',
    role: 'user',
    provider: sessionUser.app_metadata?.provider
  };

  localStorage.setItem('unicorn_user', JSON.stringify(user));
  return user;
};

      if (typeof window !== 'undefined') {
        localStorage.setItem('unicorn_user', JSON.stringify(user));
      }

      return user;
    }

    throw new Error('Invalid email or password');
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signInWithOAuth = async (provider: 'google' | 'facebook' | 'linkedin'): Promise<User> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user: User = {
      id: `${provider}_user_id`,
      email: `user@${provider}.com`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      role: 'user',
      provider: provider
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('unicorn_user', JSON.stringify(user));
    }

    return user;
  } catch (error) {
    console.error(`${provider} sign in error:`, error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unicorn_user');
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  try {
    if (typeof window === 'undefined') return null;
    const userStr = window.localStorage.getItem('unicorn_user');
    if (!userStr) return null;
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};
