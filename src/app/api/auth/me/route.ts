import { NextResponse } from 'next/server';
import { getSession, DEFAULT_USER } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getSession();
    return NextResponse.json({ user: user || DEFAULT_USER });
  } catch (err: any) {
    return NextResponse.json({ user: DEFAULT_USER });
  }
}
