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

    // Normalize phone number (remove everything except digits)
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Create broad search terms
    let searchTerms = new Set<string>();
    searchTerms.add(phoneNumber);
    searchTerms.add(digitsOnly);
    
    // If it's a standard 10-digit French number starting with 0
    if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
      searchTerms.add(digitsOnly);
      searchTerms.add('+33' + digitsOnly.substring(1));
      // Also add versions with common space patterns if needed, but digitsOnly is better
    }
    
    // If it starts with 33
    if (digitsOnly.startsWith('33') && digitsOnly.length === 11) {
      searchTerms.add('0' + digitsOnly.substring(2));
      searchTerms.add('+' + digitsOnly);
    }
    
    // If it starts with +33
    if (phoneNumber.startsWith('+33')) {
      const core = phoneNumber.substring(3).replace(/\D/g, '');
      searchTerms.add('0' + core);
      searchTerms.add(phoneNumber.replace(/\s/g, ''));
    }

    console.log('Searching for client with terms:', Array.from(searchTerms));

    // 1. Identify Client by phone number (searching across multiple potential formats)
    const clientsRef = collection(db, 'clients');
    let querySnapshot = null;
    
    // Try to find the client by checking multiple types of phone fields if they exist
    for (const term of Array.from(searchTerms)) {
      // Search in 'phone' field
      const q1 = query(clientsRef, where('phone', '==', term), limit(1));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        querySnapshot = snap1;
        break;
      }
      
      // Also search in 'contact_info' field (common for legacy data)
      const q2 = query(clientsRef, where('contact_info', '==', term), limit(1));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        querySnapshot = snap2;
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
