import {createClient} from '@supabase/supabase-js';
import {NextResponse} from 'next/server';

export async function authorizedClient(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!url || !key || !token) return null;
  const db = createClient(url, key, {
    global: {headers: {Authorization: `Bearer ${token}`}},
    auth: {persistSession: false, autoRefreshToken: false}
  });
  const {data: {user}, error} = await db.auth.getUser(token);
  if (error || !user) return null;
  return {db, user};
}
export const unauthorized = () => NextResponse.json({error: 'Sign in required'}, {status: 401});
