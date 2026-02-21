
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, filename, type, interventionId, address } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'Missing PDF content' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Smart Lock <onboarding@resend.dev>',
      to: ['alkhastvatsaev@gmail.com'],
      subject: `${type === 'QUOTE' ? 'Devis' : 'Facture'} - ${address}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #000;">${type === 'QUOTE' ? 'Nouveau Devis' : 'Nouvelle Facture'}</h1>
          <p>Une nouvelle intervention a été générée.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID Intervention :</strong> ${interventionId}</p>
            <p><strong>Adresse :</strong> ${address}</p>
          </div>
          <p>Veuillez trouver le document PDF en pièce jointe.</p>
          <br/>
          <p style="font-size: 12px; color: #888;">Envoyé automatiquement par SMART LOCK MANAGER</p>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Email API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
