'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function checkAdminPassword(formData: FormData) {
  const password = formData.get('password') as string

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
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
