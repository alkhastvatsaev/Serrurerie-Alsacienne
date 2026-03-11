import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const phoneNumber = formData.get('phoneNumber') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 });
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Numéro de téléphone manquant' }, { status: 400 });
    }

    // 1. Transcription avec OpenAI Whisper
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'fr',
      prompt: 'Serrurerie, dépannage, porte claquée, cylindre, barillet, prix, rendez-vous, urgence.',
    });

    const transcriptText = transcription.text;

    // 2. Résumé avec GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert pour une entreprise de serrurerie. Résume cet appel en quelques points clés (objet de l\'appel, urgence, matériel mentionné, suite à donner). Sois très bref et professionnel.'
        },
        { role: 'user', content: transcriptText },
      ],
      max_tokens: 200,
    });

    const summary = completion.choices[0].message.content;

    // 3. Trouver le dossier client et enregistrer
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const clientsRef = collection(db, 'clients');
    
    // On cherche les différents formats possibles dans la base
    const searchTerms = [phoneNumber, digitsOnly];
    if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
      searchTerms.push('+33' + digitsOnly.substring(1));
    }

    let clientDocId = null;
    let clientName = 'Inconnu';

    for (const term of searchTerms) {
      const q = query(clientsRef, where('phone', '==', term));
      const snap = await getDocs(q);
      if (!snap.empty) {
        clientDocId = snap.docs[0].id;
        clientName = snap.docs[0].data().name;
        break;
      }
    }

    if (!clientDocId) {
      // Create new prospect
      const newClientRef = await addDoc(clientsRef, {
        name: `🆕 Nouveau Prospect (Appel ${phoneNumber})`,
        phone: digitsOnly,
        contact_info: phoneNumber,
        created_at: serverTimestamp()
      });
      clientDocId = newClientRef.id;
    }

    // Add activity in subcollection
    if (clientDocId) {
      const activityId = `call-${Date.now()}`;
      const activityRef = doc(db, 'clients', clientDocId, 'activities', activityId);
      
      await setDoc(activityRef, {
        id: activityId,
        type: 'call',
        title: '📞 Transcription Appel Auto',
        description: `**Résumé de l'appel :**\n${summary}\n\n**Transcription intégrale :**\n${transcriptText}`,
        timestamp: new Date().toISOString(),
        metadata: { direction: 'inbound' }
      });
    }

    return NextResponse.json({
      success: true,
      clientName,
      summary,
      transcript: transcriptText
    });

  } catch (error: any) {
    console.error('Error processing transcript:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
