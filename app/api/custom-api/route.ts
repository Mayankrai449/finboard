import { NextRequest, NextResponse } from 'next/server';

// API Keys from environment
const API_KEYS = {
  TWELVE_DATA: process.env.TWELVE_DATA_API_KEY,
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY,
  FINNHUB: process.env.FINNHUB_API_KEY,
  INDIAN_API: process.env.INDIAN_API_KEY,
};

interface ApiConfig {
  pattern: RegExp;
  paramName: string;
  envKey: keyof typeof API_KEYS;
  headerAuth?: boolean;
  headerName?: string;
}

const API_CONFIGS: ApiConfig[] = [
  {
    pattern: /api\.twelvedata\.com/i,
    paramName: 'apikey',
    envKey: 'TWELVE_DATA',
  },
  {
    pattern: /alphavantage\.co/i,
    paramName: 'apikey',
    envKey: 'ALPHA_VANTAGE',
  },
  {
    pattern: /finnhub\.io/i,
    paramName: 'token',
    envKey: 'FINNHUB',
  },
  {
    pattern: /stock\.indianapi\.in/i,
    paramName: '',
    envKey: 'INDIAN_API',
    headerAuth: true,
    headerName: 'X-Api-Key',
  },
];

function detectApiProvider(url: string): ApiConfig | null {
  for (const config of API_CONFIGS) {
    if (config.pattern.test(url)) {
      return config;
    }
  }
  return null;
}

function processApiUrl(originalUrl: string, config: ApiConfig): string {
  // For header-based auth (Indian API), return URL as-is
  if (config.headerAuth) {
    return originalUrl;
  }

  const envApiKey = API_KEYS[config.envKey];
  if (!envApiKey) {
    // No env key available, return original URL
    return originalUrl;
  }

  try {
    const urlObj = new URL(originalUrl);
    const existingKey = urlObj.searchParams.get(config.paramName);

    if (!existingKey) {
      // No key in URL, add from env
      urlObj.searchParams.set(config.paramName, envApiKey);
    } else if (existingKey.includes('demo') || existingKey.length < 10) {
      // Partial/demo key, replace with env key
      urlObj.searchParams.set(config.paramName, envApiKey);
    }
    // If valid key exists in URL, keep it

    return urlObj.toString();
  } catch (e) {
    return originalUrl;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Detect API provider
  const apiConfig = detectApiProvider(url);
  
  // Process URL to add/update API keys
  const processedUrl = apiConfig ? processApiUrl(url, apiConfig) : url;

  // Validate URL format for non-Indian API
  if (!apiConfig?.headerAuth) {
    try {
      new URL(processedUrl);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
  }

  try {
    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add header-based auth if needed (Indian API)
    if (apiConfig?.headerAuth && apiConfig.headerName) {
      const apiKey = API_KEYS[apiConfig.envKey];
      if (apiKey) {
        headers[apiConfig.headerName] = apiKey;
      }
    }

    const response = await fetch(processedUrl, {
      method: 'GET',
      headers,
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
