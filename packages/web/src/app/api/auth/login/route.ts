import { NextRequest, NextResponse } from 'next/server';

const IDENTITY_SERVICE_URL = process.env['IDENTITY_SERVICE_URL'] ?? 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${IDENTITY_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const nextResponse = NextResponse.json(data, { status: response.status });

    if (data.accessToken) {
      nextResponse.cookies.set('access_token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
        path: '/',
      });
    }

    if (data.refreshToken) {
      nextResponse.cookies.set('refresh_token', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to connect to identity service' } },
      { status: 502 },
    );
  }
}
