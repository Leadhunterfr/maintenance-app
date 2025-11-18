#!/bin/bash

# Script de déploiement du backend sur le Raspberry Pi

RPI_HOST="rpi011@100.80.237.57"
REMOTE_DIR="/home/rpi011/maintenance-backend"

echo "🚀 Déploiement du backend sur rpi011..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Créer le répertoire sur le RPI
echo "📁 Création du répertoire sur le RPI..."
ssh $RPI_HOST "mkdir -p $REMOTE_DIR"
echo "✅ Répertoire créé"
echo ""

# 2. Copier les fichiers backend
echo "📦 Copie des fichiers backend..."
rsync -av --exclude='node_modules' --exclude='.git' ./backend/ $RPI_HOST:$REMOTE_DIR/
echo "✅ Fichiers copiés"
echo ""

# 3. Installer Node.js si nécessaire
echo "🔧 Vérification de Node.js..."
ssh $RPI_HOST << 'ENDSSH'
if ! command -v node &> /dev/null; then
    echo "📦 Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installé"
else
    echo "✅ Node.js déjà installé ($(node --version))"
fi
ENDSSH
echo ""

# 4. Installer les dépendances
echo "📦 Installation des dépendances npm..."
ssh $RPI_HOST "cd $REMOTE_DIR && npm install"
echo "✅ Dépendances installées"
echo ""

# 5. Initialiser la base de données
echo "🗄️  Initialisation de la base de données..."
ssh $RPI_HOST "cd $REMOTE_DIR && node init-db.mjs"
echo "✅ Base de données initialisée"
echo ""

# 6. Installer PM2
echo "⚙️  Installation de PM2..."
ssh $RPI_HOST << 'ENDSSH'
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✅ PM2 installé"
else
    echo "✅ PM2 déjà installé"
fi
ENDSSH
echo ""

# 7. Démarrer le serveur avec PM2
echo "🚀 Démarrage du serveur avec PM2..."
ssh $RPI_HOST "cd $REMOTE_DIR && pm2 start server.js --name maintenance-api"
ssh $RPI_HOST "pm2 save"
ssh $RPI_HOST "pm2 startup systemd -u rpi011 --hp /home/rpi011"
echo "✅ Serveur démarré"
echo ""

# 8. Vérifier le statut
echo "📊 Statut du serveur:"
ssh $RPI_HOST "pm2 list"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Déploiement terminé!"
echo ""
echo "🌐 API disponible sur: http://100.80.237.57:3001"
echo "🔍 Health check: http://100.80.237.57:3001/health"
echo ""
echo "📝 Commandes utiles:"
echo "   pm2 logs maintenance-api   # Voir les logs"
echo "   pm2 restart maintenance-api # Redémarrer"
echo "   pm2 stop maintenance-api    # Arrêter"
