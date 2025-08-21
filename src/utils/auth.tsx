import { supabase } from './supabaseClient';
import type { User } from '../context/AuthContext';

/**
 * Iniciar sesión con email y contraseña.
 * Al autenticarse, también lee el client_id del user_metadata
 * o lo recupera desde la tabla `users` y lo almacena en localStorage.
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
      data: {
        name: email.split('@')[0]
      }
    }
  });

  if (error) {
    console.error('Supabase signup error:', error.message);
    throw error;
  }

  if (!data.user) throw new Error('No user created');

  const newUser = data.user;

  // Espera 1 segundo a que se ejecute el trigger que inserta en la tabla `users`
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Buscar client_id en la tabla users (debe haberse creado por trigger)
  const { data: userRow, error: fetchError } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', newUser.id)
    .single();

  if (fetchError) {
    console.error('Error al obtener client_id desde users:', fetchError.message);
  }

  const clientId = userRow?.client_id;

  // Guardar client_id en localStorage si existe
  if (clientId) {
    localStorage.setItem('unicorn_client_id', clientId);
  }
  localStorage.setItem('unicorn_user_id', newUser.id); // 🔥 NUEVO

  // Guardar datos del usuario en localStorage
  const user: User = {
    id: newUser.id,
    email: newUser.email || '',
    name: newUser.user_metadata?.name || '',
    avatar: newUser.user_metadata?.avatar_url || '',
    role: 'user',
    provider: newUser.app_metadata?.provider || ''
  };

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
