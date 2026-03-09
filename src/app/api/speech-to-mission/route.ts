import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Ensure OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not defined in environment variables.');
      return NextResponse.json({ error: 'OpenAI API key is missing' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1. Send the audio file to Whisper for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'fr', // French, as context suggests
      prompt: 'Serrurerie, porte claquée, canon, cylindre, barillet, multipoints, gâche, têtière.', // Provide context hints
    });

    const transcriptText = transcription.text;
    console.log('Transcription from Whisper:', transcriptText);

    // 2. Ask GPT-4o to parse mission details out of the text
    const systemPrompt = `Tu es un assistant IA expert pour une entreprise de serrurerie ("Serrurerie Alsacienne").
Le manager va te dicter une mission de dépannage. Ta tâche est de parser cette dictée et d'en extraire les informations structurées au format JSON.
Tu dois corriger les erreurs de syntaxe, comprendre le jargon de la serrurerie, et deviner la catégorie et l'urgence.

Renvoie UNIQUEMENT un objet JSON valide avec la structure suivante :
{
  "address": "string ou null (si non précise)",
  "category": "emergency" | "installation" | "repair" | "maintenance" | "automotive" | "safe" | "access_control",
  "is_emergency": boolean,
  "social_emergency_type": "none" | "baby_inside" | "pet_trapped" | "elderly_person",
  "description": "string (résumé structuré incluant les outils, matériel demandé et contexte)"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcriptText },
      ],
      response_format: { type: 'json_object' },
    });

    const aiResponse = completion.choices[0].message.content;
    const structuredMission = JSON.parse(aiResponse || '{}');

    return NextResponse.json({
      success: true,
      transcript: transcriptText,
      missionData: structuredMission,
    });

  } catch (error: any) {
    console.error('Error in speech-to-mission route:', error);
    return NextResponse.json({ error: error.message || 'Error processing audio' }, { status: 500 });
  }
}
