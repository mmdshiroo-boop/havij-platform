// app/api/nominatim/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=0&accept-language=fa`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DivarCloneApp/1.0 (contact@divarclone.com)'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Nominatim request failed' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Nominatim proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}