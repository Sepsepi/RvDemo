'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/database.types'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const role = (formData.get('role') as UserRole) || 'renter'

  // Sign up the user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    role,
  })

  if (profileError) {
    return { error: profileError.message }
  }

  // Create role-specific record
  if (role === 'owner') {
    await supabase.from('owners').insert({
      user_id: authData.user.id,
      business_name: fullName,
    })
  } else if (role === 'renter') {
    await supabase.from('renters').insert({
      user_id: authData.user.id,
    })
  }

  revalidatePath('/', 'layout')

  // Redirect based on role
  if (role === 'manager' || role === 'admin') {
    redirect('/manager/dashboard')
  } else if (role === 'owner') {
    redirect('/owner/portal')
  } else {
    redirect('/renter/browse')
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: signInError.message }
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  revalidatePath('/', 'layout')

  // Redirect based on role
  if (profile?.role === 'manager' || profile?.role === 'admin') {
    redirect('/manager/dashboard')
  } else if (profile?.role === 'owner') {
    redirect('/owner/portal')
  } else {
    redirect('/renter/browse')
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
