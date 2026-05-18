'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import { env } from '@/lib/env'
import { redis } from '@/lib/redis'
import { adminRatelimit, getIp } from '@/lib/ratelimit'

const SESSION_TTL = 60 * 60 * 24 // 24 hours in seconds

function sessionKey(token: string) {
  return `admin:session:${token}`
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return false
  const exists = await redis.exists(sessionKey(token))
  return exists === 1
}

export async function checkAdminPassword(formData: FormData) {
  const ip = await getIp()
  const { success } = await adminRatelimit.limit(ip)
  if (!success) return { error: 'Too many attempts. Try again in 15 minutes.' }

  const password = formData.get('password') as string
  if (password !== env.ADMIN_PASSWORD) {
    return { error: 'Incorrect password.' }
  }

  const token = randomUUID()
  await redis.set(sessionKey(token), '1', { ex: SESSION_TTL })

  const cookieStore = await cookies()
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL,
    path: '/',
    sameSite: 'strict',
  })

  redirect('/backstage')
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (token) await redis.del(sessionKey(token))
  cookieStore.delete('admin_session')
  redirect('/')
}
