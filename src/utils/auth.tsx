import { supabase } from './supabaseClient';
import type { User } from '../context/AuthContext';

/**
 * Iniciar sesión con email y contraseña.
 * Al autenticarse, también lee el client_id del user_metadata
 * o lo recupera desde la tabla `users` y lo almacena en localStorage.
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

  // Recuperar client_id desde el user_metadata o la tabla users
  let clientId = sessionUser.user_metadata?.client_id;
  if (!clientId) {
    // Si no está en metadata, obtén el client_id desde la tabla users
    const { data: userRow, error: fetchError } = await supabase
      .from('users')
      .select('client_id')
      .eq('id', sessionUser.id)
      .single();
    if (fetchError) {
      console.error('Supabase fetch client_id error:', fetchError.message);
    } else {
      clientId = userRow?.client_id || undefined;
    }
  }
  if (clientId) {
    // Guarda client_id en localStorage para consultas posteriores
    localStorage.setItem('unicorn_client_id', clientId);
  }

  localStorage.setItem('unicorn_user', JSON.stringify(user));
  return user;
};

/**
 * Registrar usuario con email y contraseña.
 * Crea el client_id (igual al id del usuario) y lo guarda en metadata.
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
      data: { name: email.split('@')[0] } // metadata inicial (sin client_id todavía)
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

  try {
    // Asigna al usuario un client_id igual a su id y actualiza el metadata
    const clientId = newUser.id;
    await supabase.auth.updateUser({
      data: { client_id: clientId }
    });
    // Guarda el client_id en localStorage para el nuevo usuario
    localStorage.setItem('unicorn_client_id', clientId);
  } catch (updateError: any) {
    console.error('Error updating user metadata with client_id:', updateError?.message || updateError);
  }

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
  localStorage.removeItem('unicorn_client_id');
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
