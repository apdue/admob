import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      // Start the auth process and get the URL
      const { stdout } = await execAsync('gcloud auth login --no-launch-browser --format="value(url)"');
      return NextResponse.json({ 
        status: 'need_code',
        authUrl: stdout.trim(),
        message: 'Please visit the URL and enter the code' 
      });
    } else {
      // Complete the auth process with the provided code
      const { stdout, stderr } = await execAsync(`echo ${code} | gcloud auth login --no-launch-browser --cred-file=-`);
      
      // Set up application default credentials
      await execAsync('gcloud auth application-default login --no-launch-browser');
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Authentication successful',
        details: stdout 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      },
      { status: 500 }
    );
  }
} 