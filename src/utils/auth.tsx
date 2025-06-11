import { supabase } from './supabaseClient';
import type { User } from '../context/AuthContext';

/**
 * Iniciar sesión con email y contraseña.
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Supabase login error:', error.message);
    throw error;
  }
  if (!data.user) throw new Error('No user data returned');

  const sessionUser = data.user;
  const user: User = {
    id: sessionUser.id,
    email: sessionUser.email || '',
    name: sessionUser.user_metadata?.name || '',
    avatar: sessionUser.user_metadata?.avatar_url || '',
    role: 'user',
    provider: sessionUser.app_metadata?.provider || ''
  };

  localStorage.setItem('unicorn_user', JSON.stringify(user));
  return user;
};

/**
 * Registrar usuario con email y contraseña.
 */
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: { name: email.split('@')[0] }
    }
  });
  if (error) {
    console.error('Supabase signup error:', error.message);
    throw error;
  }
  if (!data.user) throw new Error('No user created');

  const newUser = data.user;
  const user: User = {
    id: newUser.id,
    email: newUser.email || '',
    name: newUser.user_metadata?.name || '',
    avatar: newUser.user_metadata?.avatar_url || '',
    role: 'user',
    provider: newUser.app_metadata?.provider || ''
  };

  return user;
};

/**
 * Iniciar sesión con proveedor OAuth.
 */
export const signInWithOAuth = async (
  provider: 'google' | 'facebook' | 'linkedin'
): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/login` }
  });
  if (error) {
    console.error(`${provider} sign in error:`, error.message);
    throw error;
  }
};

/**
 * Cerrar sesión.
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase signOut error:', error.message);
    throw error;
  }
  localStorage.removeItem('unicorn_user');
};

/**
 * Obtener usuario actual desde localStorage.
 */
export const getCurrentUser = (): User | null => {
  try {
    const str = localStorage.getItem('unicorn_user');
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
};

/**
 * Verificar si el usuario está autenticado.
 */
export const isAuthenticated = (): boolean => !!getCurrentUser();
