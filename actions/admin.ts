'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { adminRatelimit, getIp } from '@/lib/ratelimit'

export async function checkAdminPassword(formData: FormData) {
  // Rate limit before touching the password — prevent brute force
  const ip = await getIp()
  const { success } = await adminRatelimit.limit(ip)
  if (!success) return { error: 'Too many attempts. Try again in 15 minutes.' }

  const password = formData.get('password') as string

  if (password !== env.ADMIN_PASSWORD) {
    return { error: 'Incorrect password.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'strict',
  })

  redirect('/backstage')
}
