import { NextResponse } from 'next/server';

async function getAccessToken() {
  try {
    // Get the service account key from environment variable
    const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    
    // Make a request to get an access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: serviceAccountKey,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Failed to get access token');
  }
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    
    // Fetch AdMob account details
    const response = await fetch('https://admob.googleapis.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT || '',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AdMob API error:', errorText);
      throw new Error(`AdMob API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AdMob data' },
      { status: 500 }
    );
  }
} 