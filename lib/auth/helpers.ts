import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current user on the server
 * @returns The current user or null if not authenticated
 */
export async function getUserServer() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Require authentication on the server
 * Redirects to login if user is not authenticated
 * @returns The current user (guaranteed to be non-null)
 */
export async function requireUserServer() {
  const user = await getUserServer()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Get the current session on the server
 * @returns The current session or null if not authenticated
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

// Legacy exports for backward compatibility
export async function getUser() {
  return getUserServer()
}

export async function requireAuth() {
  return requireUserServer()
}
