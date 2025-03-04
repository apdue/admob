import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getAccessToken() {
  try {
    const { stdout } = await execAsync('gcloud auth application-default print-access-token');
    return stdout.trim();
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