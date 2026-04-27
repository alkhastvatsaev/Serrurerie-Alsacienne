#!/bin/bash

# ==============================================================================
# SCRIPT D'ENVOI AUTOMATIQUE DES APPELS POUR MACRODROID
# ==============================================================================
# 
# UTILISATION DANS MACRODROID :
# 1. Crée une nouvelle Macro "Auto Transcription"
# 2. Déclencheur : Appel terminé (Tous les contacts)
# 3. Action : Attendre avant l'action suivante (5 secondes)
# 4. Action : Script Shell
# 5. Colle le code ci-dessous dans la zone de texte
# ==============================================================================

# 1. On identifie le dossier de Cube ACR (Vérifie ce dossier sur ton téléphone)
# Dossier classique : /storage/emulated/0/Documents/CubeCallRecorder/All/
SEARCH_DIR="/storage/emulated/0/Documents/CubeCallRecorder/All/"

# 2. On trouve le fichier le plus récent (.mp3 ou .m4a)
LATEST_FILE=$(ls -t "${SEARCH_DIR}"* | head -1)

# 3. Ton URL d'application (Vérifie si c'est bien celle-là)
URL="https://serruremanager.vercel.app/api/call-transcript"

# 4. Envoi vers l'IA
# [call_number] est une variable que MacroDroid remplacera automatiquement
curl -X POST \
  -F "phoneNumber=[call_number]" \
  -F "audio=@$LATEST_FILE" \
  "$URL"
