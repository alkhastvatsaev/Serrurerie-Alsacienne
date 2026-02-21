#!/bin/bash
cd "$(dirname "$0")"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                          ║${NC}"
echo -e "${BLUE}║${NC}   ${BOLD}${CYAN}⚡ Serrurerie Alsacienne OS ${NC}${BLUE}— Dispatch Platform    ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}      ${ORANGE}v2.0 — Strasbourg Edition${NC}          ${BLUE}║${NC}"
echo -e "${BLUE}║                                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}[1/3]${NC} 🧹 Nettoyage du port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 0.3
echo -e "      ${GREEN}✓ Port 3000 libéré${NC}"

echo -e "${BLUE}[2/3]${NC} 📦 Vérification de l'environnement..."
if ! command -v node &> /dev/null; then
    echo -e "      ${RED}✗ Node.js non trouvé ! Installez-le depuis https://nodejs.org${NC}"
    read -p "Appuyez sur Entrée pour quitter..."
    exit 1
fi
echo -e "      ${GREEN}✓ Node.js $(node -v)${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "      ${ORANGE}⏳ Installation des dépendances...${NC}"
    npm install --legacy-peer-deps
    echo -e "      ${GREEN}✓ Dépendances installées${NC}"
else
    echo -e "      ${GREEN}✓ Dépendances OK${NC}"
fi

echo -e "${BLUE}[3/3]${NC} 🚀 Démarrage du serveur..."
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🌐  http://localhost:3000${NC}"
echo -e "${GREEN}  📱  Ctrl+C pour arrêter le serveur${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

(sleep 3 && open -a Safari http://localhost:3000) &

npm run dev
