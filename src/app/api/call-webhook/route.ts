import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    let { phoneNumber, type } = data;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
    }

    // Normalize phone number (remove spaces, dots, dashes)
    const normalizedMobile = phoneNumber.replace(/[\s\.\-\(\)]/g, '');
    
    // Create variants for searching (with/without +33, with/without leading 0)
    let searchTerms = [phoneNumber, normalizedMobile];
    if (normalizedMobile.startsWith('+33')) {
      searchTerms.push('0' + normalizedMobile.substring(3));
    } else if (normalizedMobile.startsWith('0') && normalizedMobile.length === 10) {
      searchTerms.push('+33' + normalizedMobile.substring(1));
    }

    // 1. Identify Client by phone number (searching across multiple potential formats)
    const clientsRef = collection(db, 'clients');
    let querySnapshot = null;
    
    // Try to find the client by checking normalized mobile or exact match
    for (const term of searchTerms) {
      const q = query(clientsRef, where('phone', '==', term), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        querySnapshot = snap;
        break;
      }
    }

    let clientId = null;
    let clientName = 'Inconnu';

    if (querySnapshot && !querySnapshot.empty) {
      const clientDoc = querySnapshot.docs[0];
      clientId = clientDoc.id;
      clientName = clientDoc.data().name;
    }

    // 2. Log the activity in a global "active_calls" collection
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
