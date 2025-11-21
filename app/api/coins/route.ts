import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 300; // 5 minutes in seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'coins/markets';
    const params = Object.fromEntries(searchParams.entries());
    delete params.path;

    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${COINGECKO_API_URL}/${path}?${queryString}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: CACHE_DURATION
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { 
            status: 429,
            headers: {
              'Retry-After': '60'
            }
          }
        );
      }

      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json([]);
    }

    const headersList = headers();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `s-maxage=${CACHE_DURATION}, stale-while-revalidate`
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}