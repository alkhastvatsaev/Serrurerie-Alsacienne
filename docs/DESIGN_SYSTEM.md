# 🎨 Écosystème de Design - Serrurerie Alsacienne Dashboard

## Vue d'ensemble

Ce document décrit l'écosystème de design cohérent implémenté dans l'application Serrurerie Alsacienne.

---

## 🎨 Palette de Couleurs

### Couleurs des Techniciens

Utilisées de manière cohérente dans toute l'application :

- **Marc (ID: 2)** : `#007AFF` - Bleu iOS
- **Sophie (ID: 3)** : `#FF9500` - Orange iOS
- **Lucas (ID: 4)** : `#34C759` - Vert iOS
- **Inconnu** : `#8E8E93` - Gris iOS

**Utilisation** :

- Marqueurs de techniciens sur la carte
- Zones territoriales
- Trajets/routes
- Avatars dans les listes
- Badges et indicateurs

### Couleurs de Statut

- **Pending** : `#007AFF` (Bleu)
- **In Progress** : `#5856D6` (Violet)
- **Waiting Approval** : `#FF9500` (Orange)
- **Done** : `#34C759` (Vert)
- **Cancelled** : `#FF3B30` (Rouge)

### Couleurs de Paiement

- **Paid** : `#34C759` (Vert)
- **Unpaid** : `#FF9500` (Orange)
- **Pending** : `#007AFF` (Bleu)

---

## 📐 Système de Design

### Glassmorphism

Trois niveaux de transparence :

- **Light** : `bg-white/80 backdrop-blur-xl border border-black/5`
- **Medium** : `bg-white/90 backdrop-blur-xl border border-black/10`
- **Dark** : `bg-black/80 backdrop-blur-xl border border-white/10`

### Border Radius

- **sm** : `0.75rem` (12px) - Petits éléments
- **md** : `1rem` (16px) - Cartes moyennes
- **lg** : `1.5rem` (24px) - Grandes cartes
- **xl** : `2rem` (32px) - Panneaux
- **full** : `9999px` - Boutons ronds

### Ombres

- **sm** : `0 2px 4px rgba(0,0,0,0.05)` - Subtile
- **md** : `0 4px 8px rgba(0,0,0,0.1)` - Standard
- **lg** : `0 8px 16px rgba(0,0,0,0.15)` - Prononcée
- **xl** : `0 12px 24px rgba(0,0,0,0.2)` - Dramatique

---

## 🗺️ Composants de la Carte

### Zones Territoriales

- **Format de données** : `{lat: number, lng: number}[]` (compatible Firestore)
- **Affichage** : Polygones avec couleur du technicien
- **Opacité** :
  - Mode normal : `0.08`
  - Mode édition : `0.2`
- **Bordure** :
  - Mode normal : `dashArray: '5, 10'`
  - Mode édition : `dashArray: '5, 5'`

### Trajets/Routes

- **Couleur** : Couleur du technicien assigné
- **Poids** :
  - Mission normale : `3px`
  - En attente validation : `4px`
- **Opacité** :
  - Mission normale : `0.6`
  - En attente validation : `0.8`
- **Style** :
  - Mission normale : `dashArray: '10, 10'`
  - En attente validation : `dashArray: '5, 10'`

### Marqueurs Techniciens

- **Taille** : `36px × 36px`
- **Bordure** : `2.5px solid white`
- **Ombre** : `0 4px 12px rgba(0,0,0,0.2)`
- **Couleur de fond** : Couleur du technicien
- **Initiales** : 2 lettres, blanc, font-weight 900

### Marqueurs Interventions

- **Taille** : `32px × 32px`
- **Couleur** :
  - En attente : Orange
  - En cours : Bleu
  - Terminée : Vert

---

## 📱 Interface Utilisateur

### Panneau Latéral Gauche

- **Largeur** : `320px` (80rem)
- **Style** : Glassmorphism medium
- **Animation** : Slide in/out `300ms ease-in-out`
- **Sections** :
  1. Header avec date
  2. Résumé quotidien (CA + Missions)
  3. Alertes de validation
  4. Timeline des missions actives

### Header (Top Right)

- **Bouton Hub Central** :
  - Taille : `48px × 48px`
  - Icône : Settings
  - Couleur : Foreground/Background inversé
  - Bordure : `4px border-white/20`
- **Bouton Sauvegarder** (mode édition) :
  - Couleur : `bg-green-500`
  - Icône : Save
  - Apparition conditionnelle

### Bouton Toggle Sidebar

- **Position** : Top left quand fermé
- **Taille** : `44px × 44px`
- **Icône** : ChevronRight
- **Animation** : `hover:scale-105 active:scale-95`

---

## 🔄 Synchronisation Firebase

### Structure de Données

```typescript
// Collection: settings/zones
{
  zones: [
    {
      techId: string,
      name: string,
      color: string,
      positions: [
        { lat: number, lng: number },
        ...
      ]
    }
  ]
}
```

### Listeners Temps Réel

1. **Interventions** : `collection(db, 'interventions')`
2. **Messages** : `collection(db, 'messages')` (orderBy timestamp)
3. **Zones** : `doc(db, 'settings', 'zones')`

### Fallback Storage

- **localStorage** : Utilisé si disponible
- **Memory storage** : Fallback automatique si localStorage échoue
- **Détection** : Test au démarrage avec `__zustand_test__`

---

## 🎯 Interactions

### Hover States

- **Boutons** : `hover:scale-105`
- **Cartes** : `hover:shadow-md`
- **Liens** : `hover:bg-gray-50`

### Active States

- **Boutons** : `active:scale-95`
- **Transitions** : `200ms ease-in-out`

### Animations

- **Fade In** : `animate-in fade-in duration-200`
- **Slide Left** : `animate-in slide-in-from-left duration-300`
- **Slide Right** : `animate-in slide-in-from-right duration-300`
- **Scale In** : `animate-in zoom-in-95 duration-200`
- **Pulse** : `animate-pulse` (pour alertes)

---

## 📊 Typographie

### Tailles

- **xs** : `10px` - Labels, timestamps
- **sm** : `12px` - Texte secondaire
- **base** : `14px` - Texte principal
- **lg** : `16px` - Titres de section
- **xl** : `20px` - Titres de page
- **2xl** : `24px` - Titres principaux

### Poids

- **normal** : 400 - Texte courant
- **medium** : 500 - Texte important
- **semibold** : 600 - Sous-titres
- **bold** : 700 - Titres
- **black** : 900 - Titres majeurs, badges

### Casse

- **UPPERCASE** : Labels, badges, boutons d'action
- **Capitalize** : Titres de section
- **Normal** : Texte courant

---

## 🔧 Fonctions Utilitaires

### `getTechColor(techId: string): string`

Retourne la couleur du technicien basée sur son ID.

### `getStatusColor(status: string): string`

Retourne la couleur du statut d'intervention.

### `getPaymentColor(status: string): string`

Retourne la couleur du statut de paiement.

---

## 📱 Responsive Design

### Breakpoints

- **Mobile** : `< 640px`
- **Tablet** : `640px - 1024px`
- **Desktop** : `> 1024px`

### Adaptations

- **Sidebar** : Overlay sur mobile, fixe sur desktop
- **Header** : Padding réduit sur mobile
- **Boutons** : Taille réduite sur mobile (`h-11` vs `h-12`)
- **Texte** : Tailles réduites sur mobile

---

## ✅ Checklist de Cohérence

Lors de l'ajout de nouveaux composants, vérifier :

- [ ] Utilise `getTechColor()` pour les couleurs de techniciens
- [ ] Utilise `getStatusColor()` pour les statuts
- [ ] Applique le glassmorphism approprié
- [ ] Utilise les border-radius standardisés
- [ ] Applique les transitions cohérentes
- [ ] Respecte la hiérarchie typographique
- [ ] Fonctionne sur mobile
- [ ] Synchronise avec Firebase si nécessaire
- [ ] Gère les états de chargement/erreur
- [ ] Accessible (ARIA labels, contraste)

---

**Dernière mise à jour** : 2026-02-07
**Version** : 1.0.0
