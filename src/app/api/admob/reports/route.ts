import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleAuth } from 'google-auth-library';

const execAsync = promisify(exec);

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

async function getPublisherAccount(accessToken: string) {
  const response = await fetch('https://admob.googleapis.com/v1/accounts', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT || '',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AdMob API error (accounts):', errorText);
    throw new Error('Failed to fetch AdMob account');
  }

  const data = await response.json();
  if (!data.account?.[0]?.name) {
    throw new Error('No AdMob account found');
  }

  return data.account[0].name;
}

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();
    const accessToken = await getAccessToken();
    const accountName = await getPublisherAccount(accessToken);

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Format the request according to AdMob API specification
    const reportRequest = {
      reportSpec: {
        dateRange: {
          startDate: {
            year: startDateObj.getFullYear(),
            month: startDateObj.getMonth() + 1,
            day: startDateObj.getDate(),
          },
          endDate: {
            year: endDateObj.getFullYear(),
            month: endDateObj.getMonth() + 1,
            day: endDateObj.getDate(),
          },
        },
        metrics: [
          "ESTIMATED_EARNINGS",
          "IMPRESSIONS",
          "CLICKS"
        ],
        dimensions: [
          "COUNTRY",
          "APP",
          "DATE"
        ],
        timeZone: "America/Los_Angeles"
      }
    };

    console.log('Using account:', accountName);
    console.log('Report request:', JSON.stringify(reportRequest, null, 2));

    const response = await fetch(`https://admob.googleapis.com/v1/${accountName}/networkReport:generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AdMob API error (report):', errorText);
      throw new Error(`AdMob API error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
} 