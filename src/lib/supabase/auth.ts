import { getBrowserSupabaseClient } from './client';

export interface UserProfile {
  id: string;
  email: string;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      return { id: user.id, email: user.email };
    }
  } catch (err) {
    console.warn('Failed to fetch auth user:', err);
  }
  return null;
}

export async function signUpWithEmail(email: string, password: string): Promise<{ user?: UserProfile; error?: string }> {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) {
    return { error: 'Authentication service is not configured. Please check your environment settings.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: undefined },
  });

  if (error) {
    return { error: error.message };
  }

  // If session exists, user is auto-confirmed (email confirmation disabled in Supabase)
  if (data.session && data.user && data.user.email) {
    return { user: { id: data.user.id, email: data.user.email } };
  }

  // If user exists but no session (email confirmation still enabled on Supabase dashboard),
  // auto-attempt sign-in so user doesn't hit a dead-end
  if (data.user && data.user.email) {
    const signInResult = await supabase.auth.signInWithPassword({ email, password });
    if (signInResult.data?.user?.email) {
      return { user: { id: signInResult.data.user.id, email: signInResult.data.user.email } };
    }
    // If auto-sign-in also failed, return the user anyway (they were created)
    return { user: { id: data.user.id, email: data.user.email } };
  }

  return { error: 'Registration failed. Please try again.' };
}

export async function signInWithEmail(email: string, password: string): Promise<{ user?: UserProfile; error?: string }> {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) {
    return { error: 'Authentication service is not configured. Please check your environment settings.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  if (data.user && data.user.email) {
    return { user: { id: data.user.id, email: data.user.email } };
  }
  return { error: 'Invalid authentication credentials.' };
}

export async function signOutUser(): Promise<{ error?: string }> {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return {};
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return {};
}
