
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const To = formData.get('To');

  // This is the instruction we give Twilio when the app starts a call
  // We tell it to Dial the number provided by the app
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Dial callerId="${process.env.NEXT_PUBLIC_TWILIO_CALLER_ID || '+33300000000'}">
          <Number>${To}</Number>
      </Dial>
  </Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
