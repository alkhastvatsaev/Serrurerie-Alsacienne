
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'No query provided' }, { status: 400 });
  }

  try {
    // Get refresh token from Firestore
    const settingsRef = doc(db, 'settings', 'google_oauth');
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      return NextResponse.json({ error: 'OAuth NOT configured. Visit /api/auth/google' }, { status: 401 });
    }

    const { refresh_token } = settingsDoc.data();
    oauth2Client.setCredentials({ refresh_token });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Search messages
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: q,
      maxResults: 5
    });

    const messages = res.data.messages || [];
    const detailedMessages = await Promise.all(
      messages.map(async (m) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'full'
        });

        const headers = detail.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return {
          id: m.id,
          snippet: detail.data.snippet,
          subject,
          from,
          date: new Date(date).toISOString()
        };
      })
    );

    return NextResponse.json(detailedMessages);
  } catch (error: any) {
    console.error('Gmail API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
