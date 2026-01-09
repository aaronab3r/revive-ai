'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const correctPassword = process.env.DASHBOARD_PASSWORD;

  if (password === correctPassword) {
    cookies().set('auth_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return redirect('/dashboard');
  }

  return { message: 'Invalid Password' };
}
