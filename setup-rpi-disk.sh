#!/bin/bash

# Script de configuration du disque dur sur Raspberry Pi
# Exécute ce script sur votre Mac, il se connecte au RPI via SSH

RPI_HOST="rpi011@100.80.237.57"
DISK="/dev/sda"
MOUNT_POINT="/mnt/data"

echo "🚀 Configuration du disque dur sur rpi011..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Créer le script de configuration sur le RPI
ssh $RPI_HOST 'bash -s' << 'ENDSSH'

set -e

DISK="/dev/sda"
MOUNT_POINT="/mnt/data"

echo "📋 Étape 1: Création de la partition..."

# Créer une partition unique sur tout le disque
sudo parted -s $DISK mklabel gpt
sudo parted -s $DISK mkpart primary ext4 0% 100%

echo "✅ Partition créée"
echo ""

# Attendre que le système détecte la partition
sleep 2

echo "💾 Étape 2: Formatage en ext4..."

# Formater la partition
sudo mkfs.ext4 -F ${DISK}1

echo "✅ Disque formaté"
echo ""

echo "📁 Étape 3: Création du point de montage..."

# Créer le répertoire de montage
sudo mkdir -p $MOUNT_POINT

echo "✅ Point de montage créé"
echo ""

echo "🔗 Étape 4: Montage du disque..."

# Monter le disque
sudo mount ${DISK}1 $MOUNT_POINT

# Donner les permissions
sudo chown -R $USER:$USER $MOUNT_POINT
sudo chmod 755 $MOUNT_POINT

echo "✅ Disque monté sur $MOUNT_POINT"
echo ""

echo "⚙️ Étape 5: Configuration du montage automatique..."

# Obtenir l'UUID de la partition
UUID=$(sudo blkid -s UUID -o value ${DISK}1)

# Ajouter à /etc/fstab pour montage automatique au démarrage
if ! grep -q "$UUID" /etc/fstab; then
    echo "UUID=$UUID $MOUNT_POINT ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
    echo "✅ Montage automatique configuré"
else
    echo "ℹ️  Montage automatique déjà configuré"
fi

echo ""
echo "📊 Vérification finale:"
df -h $MOUNT_POINT
echo ""
echo "✨ Disque prêt!"

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration terminée!"
echo ""
echo "Le disque est maintenant disponible sur: /mnt/data"
echo "Capacité: 60 GB"
echo "Montage automatique: activé"
