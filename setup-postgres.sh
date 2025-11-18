#!/bin/bash

# Script d'installation et configuration de PostgreSQL sur Raspberry Pi
# Stockage des données sur le disque externe /mnt/data

RPI_HOST="rpi011@100.80.237.57"

echo "🐘 Installation de PostgreSQL sur rpi011..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh $RPI_HOST 'bash -s' << 'ENDSSH'

set -e

DATA_DIR="/mnt/data/postgresql"
PG_VERSION="15"

echo "📦 Étape 1: Installation de PostgreSQL..."

# Mise à jour des paquets
sudo apt-get update -qq

# Installation de PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

echo "✅ PostgreSQL installé"
echo ""

echo "🛑 Étape 2: Arrêt de PostgreSQL..."

sudo systemctl stop postgresql

echo "✅ PostgreSQL arrêté"
echo ""

echo "📁 Étape 3: Déplacement des données vers le disque externe..."

# Créer le répertoire de données
sudo mkdir -p $DATA_DIR

# Copier les données existantes
sudo rsync -av /var/lib/postgresql/$PG_VERSION/main/ $DATA_DIR/

# Changer le propriétaire
sudo chown -R postgres:postgres $DATA_DIR

echo "✅ Données déplacées vers $DATA_DIR"
echo ""

echo "⚙️ Étape 4: Configuration de PostgreSQL..."

# Modifier le fichier de configuration pour pointer vers le nouveau répertoire
sudo sed -i "s|data_directory = '/var/lib/postgresql/$PG_VERSION/main'|data_directory = '$DATA_DIR'|" /etc/postgresql/$PG_VERSION/main/postgresql.conf

# Permettre les connexions depuis localhost
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/$PG_VERSION/main/postgresql.conf

# Ajouter une entrée pour autoriser les connexions locales
echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a /etc/postgresql/$PG_VERSION/main/pg_hba.conf

echo "✅ PostgreSQL configuré"
echo ""

echo "🚀 Étape 5: Démarrage de PostgreSQL..."

sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "✅ PostgreSQL démarré et activé au boot"
echo ""

echo "👤 Étape 6: Création de la base de données..."

# Créer l'utilisateur et la base de données pour l'application
sudo -u postgres psql << EOF
-- Créer l'utilisateur
CREATE USER maintenance_user WITH PASSWORD 'maintenance_password_2025';

-- Créer la base de données
CREATE DATABASE maintenance_db OWNER maintenance_user;

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE maintenance_db TO maintenance_user;

\q
EOF

echo "✅ Base de données 'maintenance_db' créée"
echo "✅ Utilisateur 'maintenance_user' créé"
echo ""

echo "📊 Vérification finale:"
sudo systemctl status postgresql --no-pager | head -10
echo ""

echo "📍 Informations de connexion:"
echo "  Host: 100.80.237.57"
echo "  Port: 5432"
echo "  Database: maintenance_db"
echo "  User: maintenance_user"
echo "  Password: maintenance_password_2025"
echo ""

echo "✨ PostgreSQL prêt!"

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation terminée!"
