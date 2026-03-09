
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // We only Care about the refresh token for long-term access
    if (tokens.refresh_token) {
      await setDoc(doc(db, 'settings', 'google_oauth'), {
        refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } else {
        // If we didn't get a refresh token, it means it's already authorized 
        // and we didn't prompt for consent (though we should have with prompt: 'consent')
        console.warn("No refresh token received. User might already be authorized.");
    }

    // Redirect back to dashboard
    return NextResponse.redirect(new URL('/admin', request.url));
  } catch (error) {
    console.error('Error getting tokens:', error);
    return NextResponse.json({ error: 'Failed to exchange code' }, { status: 500 });
  }
}
