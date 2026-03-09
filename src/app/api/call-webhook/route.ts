import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { phoneNumber, type } = data; // Expected: phoneNumber: "06...", type: "incoming_call"

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
    }

    // 1. Identify Client by phone number
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('phone', '==', phoneNumber), limit(1));
    const querySnapshot = await getDocs(q);
    
    let clientId = null;
    let clientName = 'Inconnu';

    if (!querySnapshot.empty) {
      const clientDoc = querySnapshot.docs[0];
      clientId = clientDoc.id;
      clientName = clientDoc.data().name;
    }

    // 2. Log the activity in a global "active_calls" collection for real-time listener in the UI
    const callRef = collection(db, 'active_calls');
    await addDoc(callRef, {
      phoneNumber,
      clientId,
      clientName,
      timestamp: serverTimestamp(),
      type: type || 'incoming',
      status: 'ringing'
    });

    return NextResponse.json({ success: true, clientName });
  } catch (error: any) {
    console.error('Call Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
