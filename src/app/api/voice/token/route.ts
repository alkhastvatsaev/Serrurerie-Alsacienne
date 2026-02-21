
import { NextResponse } from 'next/server';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid || accountSid.includes('xxxx')) {
    return NextResponse.json({ error: 'Config missing' }, { status: 500 });
  }

  const accessToken = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity: 'admin_dashboard'
  });

  const grant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  accessToken.addGrant(grant);

  return NextResponse.json({ token: accessToken.toJwt() });
}
