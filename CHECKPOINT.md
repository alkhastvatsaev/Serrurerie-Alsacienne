# CHECKPOINT: Refonte Backend CRM & MacroDroid

_Date: 11 Mars 2026_

## Ce qui a été fait (Session précédente)

1. **Refonte de l'Historique Client (Sous-collections)**:
   - Nous avons migré le stockage des activités de la fiche client (précédemment un tableau `activities` propice aux conflits et lourd) vers une **sous-collection Firebase dédiée** `clients/{clientId}/activities`.
   - `CustomerProfile.tsx` s'abonne maintenant en temps réel (`onSnapshot`) à cette sous-collection pour afficher la chronologie fluide (Notes, Emails, Appels, Interventions).
2. **Refonte du Webhook MacroDroid (100% Backend)**:
   - L'interception des appels a été basculée d'un listener Frontend (qui créait des fiches en double si 2 personnes avaient le dashboard ouvert) vers une API robuste : `/api/call-transcript`.
   - L'API reçoit l'audio et le numéro. Si le numéro est inconnu, le serveur **crée un nouveau client ("Prospect")**.
   - Le serveur enregistre la transcription IA directement dans la nouvelle sous-collection `activities` du client concerné.
3. **Déploiement**:
   - Poussé sur la branche `main` et déployé en production sur **Vercel** (`serrure.vercel.app`).
4. **Simplification MacroDroid**:
   - Un fichier pré-configuré `Serrurier_Auto_Transcript.macro` a été généré et placé dans le dossier `public/`.
   - Lien direct de téléchargement : `https://serrure.vercel.app/Serrurier_Auto_Transcript.macro`

## Ce qu'il reste à faire (Prochaine Étape)

1. **Tests Terrain de MacroDroid** :
   - Le client (utilisateur) doit télécharger le fichier `.macro` depuis son téléphone ou créer la macro manuellement avec les paramètres suivants :
     - **Déclencheur**: Appel terminé
     - **Action**: Requête POST via curl vers l'API Vercel avec le fichier dictaphone.
   - Vérifier sur le tableau de bord qu'un numéro inconnu crée bien un profil Prospect et que la transcription est injectée dans sa _Timeline_.
2. **Vérifications optionnelles** :
   - Tester l'envoi d'un devis par mail et s'assurer qu'un document d'historique 📄 est bien ajouté dans la sous-collection.
   - Traquer la création d'une nouvelle mission et vérifier l'encart d'historique 📅.

_Le système est prêt et sain. À vous de jouer avec les tests d'appels !_
