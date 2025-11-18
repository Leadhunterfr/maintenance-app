#!/bin/bash

# Script pour trouver quel Raspberry Pi a le disque dur externe monté

echo "🔍 Recherche du Raspberry Pi avec disque dur externe..."
echo ""

# Liste des RPi connectés
RPI_LIST=(
  "rpi003:100.114.110.116"
  "rpi004:100.91.214.34"
  "rpi006:100.127.29.101"
  "rpi007:100.120.189.123"
  "rpi011:100.80.237.57"
)

for rpi in "${RPI_LIST[@]}"; do
  IFS=':' read -r name ip <<< "$rpi"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📡 Test de $name ($ip)..."
  echo ""

  # Test de connexion (le username est le même que le nom du RPI)
  if ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no $name@$ip "echo 'Connecté!'" 2>/dev/null; then
    echo "✅ Connexion SSH réussie"
    echo ""
    echo "💾 Disques montés:"
    ssh $name@$ip "df -h | grep -E '(Filesystem|/dev/sd|/dev/nvme|/mnt|/media)'"
    echo ""
    echo "📊 Tous les périphériques de stockage:"
    ssh $name@$ip "lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E '(NAME|sd|nvme)'"
    echo ""
  else
    echo "❌ Impossible de se connecter à $name"
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Recherche terminée!"
