import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Try to get current account info
    const { stdout } = await execAsync('gcloud auth list --filter=status:ACTIVE --format="value(account)"');
    
    return NextResponse.json({ 
      isAuthenticated: !!stdout.trim(),
      account: stdout.trim() || null
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ 
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Failed to check authentication status'
    });
  }
} 