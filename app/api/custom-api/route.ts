import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = `The API returned an error (${statusCode})`;
      
      if (statusCode === 404) {
        errorMessage = 'The API endpoint was not found (404). Please verify the URL.';
      } else if (statusCode === 403) {
        errorMessage = 'Access denied (403). The API may require authentication or API keys.';
      } else if (statusCode === 401) {
        errorMessage = 'Unauthorized (401). The API requires authentication.';
      } else if (statusCode === 500) {
        errorMessage = 'The API server encountered an internal error (500).';
      } else if (statusCode === 503) {
        errorMessage = 'The API service is temporarily unavailable (503). Please try again later.';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    const data = await response.json();

    // Return the raw response as-is for field exploration
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from custom API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the provided URL' },
      { status: 500 }
    );
  }
}
