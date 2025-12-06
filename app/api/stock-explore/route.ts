import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  if (!FINNHUB_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Fetch quote data
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`
    );
    const quoteData = await quoteResponse.json();

    // Fetch company profile
    const profileResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`
    );
    const profileData = await profileResponse.json();

    // Check for valid data
    if (quoteData.c === 0 && quoteData.h === 0) {
      return NextResponse.json({ error: 'Stock symbol not found' }, { status: 404 });
    }

    // Return the complete raw response with nested structure
    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      quote: quoteData,
      profile: profileData,
      // Also include formatted/mapped data for backwards compatibility
      mapped: {
        symbol: symbol.toUpperCase(),
        companyName: profileData.name || symbol.toUpperCase(),
        currentPrice: quoteData.c,
        highPrice: quoteData.h,
        lowPrice: quoteData.l,
        openPrice: quoteData.o,
        previousClose: quoteData.pc,
        change: quoteData.d,
        changePercent: quoteData.dp,
        industry: profileData.finnhubIndustry || 'N/A',
        country: profileData.country || 'N/A',
      }
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
