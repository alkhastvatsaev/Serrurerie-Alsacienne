# 🚀 Checklist de Production - Serrure PWA (Belgique)

Ce document sert de suivi pour la transition commerciale de l'application.

## 🇧🇪 1. Identité & Branding (Priorité Haute)
- [x] Centraliser la configuration dans `src/config/business.ts`.
- [ ] Remplacer le nom "Serrurerie Alsacienne" par le nom du client belge.
- [ ] Intégrer le logo officiel du client.
- [ ] Ajuster la palette de couleurs (Or/Bleu Profond) selon les préférences du client.
- [ ] Mettre à jour le Manifest PWA (icônes, nom court).

## ⚖️ 2. Conformité & Fiscalité (Belgique)
- [ ] Configurer les taux de TVA belges (6% pour rénovation, 21% standard).
- [ ] Vérifier la structure des numéros de téléphone (+32 au lieu de +33).
- [ ] Adapter le format des adresses postales (Code postal avant la ville).
- [ ] Préparer le template de facture PDF avec les mentions légales belges.

## ⚙️ 3. Infrastructure & Sécurité
- [ ] Créer un projet Firebase "Production" distinct du projet de test.
- [ ] Passer Stripe en mode "Live" (après validation des tests).
- [ ] Configurer le domaine final (ex: `app.client-belge.be`).
- [ ] Mettre en place les règles de sécurité Firestore (Security Rules).
- [ ] Backup automatique de la base de données.

## 📱 4. Expérience Utilisateur (Premium)
- [ ] Optimisation de la vitesse de chargement (Core Web Vitals).
- [ ] Validation du mode Offline (Service Workers).
- [ ] Test complet sur iPhone (cible prioritaire pour le luxe/pro).
- [ ] Animations "Wow Effect" sur les transitions d'écrans.

## 📅 5. Livraison & Suivi
- [ ] Rédaction du manuel utilisateur (PDF court).
- [ ] Mise en place du `docs/JOURNAL.md` pour le suivi quotidien.
- [ ] Préparation du premier rapport hebdomadaire (Loom).
