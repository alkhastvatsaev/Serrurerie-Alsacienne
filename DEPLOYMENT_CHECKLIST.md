# 🚀 Checklist de Déploiement — SERRURE Strasbourg

Ce document récapitule les étapes nécessaires pour passer l'application en production.

## 1. Variables d'Environnement (Secrets)

Créez un environnement de production (sur Vercel de préférence) avec les clés suivantes :

### Firebase (Base de données & Auth)

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Votre clé API Firebase.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `serruremanager`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

### Paiements & Finance

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Clé publique Stripe (commence par `pk_live_`).
- `STRIPE_SECRET_KEY`: Clé secrète Stripe (commence par `sk_live_`).
- `ALMA_API_KEY`: Clé API pour le paiement en 3x (Alma).

### Téléphonie & Communication

- `TWILIO_ACCOUNT_SID`: SID de votre compte Twilio.
- `TWILIO_AUTH_TOKEN`: Token d'authentification Twilio.
- `TWILIO_API_KEY_SID`: Pour les appels Voice.
- `TWILIO_API_KEY_SECRET`: Pour les appels Voice.
- `TWILIO_TWIML_APP_SID`: Identifiant de l'application TwiML configurée.
- `NEXT_PUBLIC_TWILIO_CALLER_ID`: Le numéro de téléphone Twilio acheté (format +33...).
- `RESEND_API_KEY`: Clé API pour l'envoi des factures par email.

### Intelligence Artificielle

- `NEXT_PUBLIC_GEMINI_API_KEY`: Votre clé Google AI Studio pour la reconnaissance de serrures.

## 2. Configuration Firestore (Règles de sécurité)

Avant le déploiement, vous **DEVEZ** mettre à jour vos règles Firestore dans le dashboard Firebase pour sécuriser les données :

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Seul l'admin a accès à tout
    match /{document=**} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Les techniciens peuvent voir et modifier leurs propres interventions
    match /interventions/{interventionId} {
      allow read, update: if request.auth != null && resource.data.tech_id == request.auth.uid;
    }
  }
}
```

## 3. Configuration Nom de Domaine

1.  Acheter votre domaine (ex: `serrure-strasbourg.fr`).
2.  Lier le domaine dans Vercel (Section Settings -> Domains).
3.  **HTTPS** : Vercel gérera le certificat SSL automatiquement (requis pour Apple Pay).

## 4. Google AI Studio (Gemini)

Assurez-vous que votre clé API Gemini n'a pas de restriction de domaine au début, puis ajoutez votre domaine final pour plus de sécurité.

---

_Note : Une fois ces étapes terminées, l'application passera automatiquement du mode "Simulation" au mode "Réel"._
