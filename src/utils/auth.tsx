import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
  provider?: string;
}

// 🔐 Iniciar sesión con email y contraseña
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

  if (typeof window !== 'undefined') {
    localStorage.setItem('unicorn_user', JSON.stringify(user));
  }

  return user;
};

// 🌐 Login con OAuth (Google, Facebook, LinkedIn)
export const signInWithOAuth = async (provider: 'google' | 'facebook' | 'linkedin') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin // o una ruta tipo `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    console.error(`${provider} sign in error:`, error.message);
    throw new Error(error.message);
  }
};

// 🔓 Cerrar sesión
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('unicorn_user');
  }
};

// 👤 Obtener usuario actual
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

// ✅ Verificar si está autenticado
export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};
