# Guide de Déploiement & Configuration

## URLs et Accès

### Frontend
- **URL Vercel**: https://maintenance-app-alpha.vercel.app
- **Repository GitHub**: https://github.com/Leadhunterfr/maintenance-app
- **Repository alternatif**: https://github.com/u5732555133-stack/maintenance-app

### Backend API
- **URL publique (Tailscale Funnel)**: https://rpi011.taild92b43.ts.net
- **URL interne Tailscale**: http://100.80.237.57:3001
- **Health check**: https://rpi011.taild92b43.ts.net/health

## Configuration Backend (RPI)

### PostgreSQL
```bash
# Localisation de la base de données
/mnt/data/postgresql

# Connexion à la base
ssh rpi011@100.80.237.57
sudo -u postgres psql -d maintenance_db

# Informations de connexion (depuis .env)
DB_HOST=100.80.237.57
DB_PORT=5432
DB_NAME=maintenance_db
DB_USER=maintenance_user
DB_PASSWORD=maintenance_password_2025
```

### Backend Node.js
```bash
# Localisation du code backend
/home/rpi011/maintenance-backend

# Commandes PM2 utiles
ssh rpi011@100.80.237.57
pm2 logs maintenance-api       # Voir les logs
pm2 restart maintenance-api    # Redémarrer
pm2 stop maintenance-api       # Arrêter
pm2 status                     # Statut

# Redéployer le backend
bash deploy-backend.sh
```

### Tailscale Funnel
```bash
# Configuration actuelle
sudo tailscale funnel --bg --https=443 --set-path=/ http://127.0.0.1:3001

# Vérifier le statut
sudo tailscale funnel status

# L'API est exposée publiquement à:
https://rpi011.taild92b43.ts.net
```

## Variables d'Environnement

### Frontend (Vercel)
```bash
# À configurer dans Vercel Dashboard > Settings > Environment Variables
VITE_API_URL=https://rpi011.taild92b43.ts.net
```

### Backend (.env sur RPI)
```bash
# Database
DB_HOST=100.80.237.57
DB_PORT=5432
DB_NAME=maintenance_db
DB_USER=maintenance_user
DB_PASSWORD=maintenance_password_2025

# JWT
JWT_SECRET=maintenance-jwt-secret-2025-raspberry-pi-super-secure-key

# Server
PORT=3001

# Email (SMTP Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Architecture

```
┌─────────────────┐
│  Utilisateur    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Vercel         │ ← Frontend React (auto-deploy depuis GitHub)
│  (Frontend)     │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│ Tailscale Funnel│ ← https://rpi011.taild92b43.ts.net
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  RPI (Backend)  │ ← API Node.js/Express (port 3001)
│  + PostgreSQL   │ ← Base de données sur /mnt/data/postgresql
└─────────────────┘
```

## Déploiement

### 1. Frontend (Vercel)
```bash
# Pousser sur GitHub (déclenche auto-deploy Vercel)
git add .
git commit -m "message"
git push leadhunterfr main  # Repo principal Vercel
git push origin main        # Repo alternatif (optionnel)
```

### 2. Backend (RPI)
```bash
# Depuis votre machine locale
bash deploy-backend.sh

# Ou manuellement
ssh rpi011@100.80.237.57
cd ~/maintenance-backend
git pull  # si vous avez un repo git
pm2 restart maintenance-api
```

## Scripts Utiles

### Créer un Super Admin
```bash
# Utiliser le script test-api-flow.mjs
node test-api-flow.mjs
```

### Tester l'API
```bash
# Health check
curl https://rpi011.taild92b43.ts.net/health

# Test login (remplacer email/password)
curl -X POST https://rpi011.taild92b43.ts.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Vérifier la base de données
```bash
ssh rpi011@100.80.237.57
sudo -u postgres psql -d maintenance_db

# Lister les super admins
SELECT email, name FROM super_admins;

# Lister les établissements
SELECT id, nom FROM etablissements;

# Lister les fiches
SELECT id, nom_tache, etablissement_id FROM fiches_maintenance;
```

## Structure du Projet

```
maintenance-app/
├── backend/              # Code backend Node.js/Express
│   ├── server.js         # Serveur principal
│   ├── db.js            # Configuration PostgreSQL
│   ├── schema.sql       # Schéma de la base de données
│   ├── init-db.mjs      # Script d'initialisation
│   ├── .env             # Variables d'environnement
│   └── middleware/
│       └── auth.js      # Middleware d'authentification JWT
│
├── src/                 # Code frontend React
│   ├── components/      # Composants React
│   ├── contexts/        # Contexts React (AuthContext)
│   ├── utils/
│   │   └── api.js       # Client API (appels backend)
│   └── App.jsx
│
├── deploy-backend.sh    # Script de déploiement backend
├── test-api-flow.mjs    # Script de test API
└── .env.example         # Exemple de variables d'environnement
```

## Sécurité

### CORS
Le backend accepte les requêtes depuis:
- https://maintenance-app-alpha.vercel.app
- http://localhost:5173 (dev)
- http://localhost:3000 (dev)

### Authentification
- JWT tokens stockés dans localStorage côté client
- Header: `Authorization: Bearer <token>`
- Expiration: configurable dans JWT_SECRET

### Base de données
- PostgreSQL sur disque externe (/mnt/data)
- Utilisateur dédié: maintenance_user
- Accès local uniquement (100.80.237.57)

## Dépannage

### L'API ne répond pas
```bash
# Vérifier le serveur
ssh rpi011@100.80.237.57
pm2 status
pm2 logs maintenance-api

# Redémarrer si nécessaire
pm2 restart maintenance-api
```

### Erreurs CORS
```bash
# Vérifier que l'origine est autorisée dans backend/server.js
origin: ['https://maintenance-app-alpha.vercel.app', ...]
```

### Base de données inaccessible
```bash
# Vérifier PostgreSQL
ssh rpi011@100.80.237.57
sudo systemctl status postgresql

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

### Tailscale Funnel ne fonctionne pas
```bash
# Vérifier le statut
ssh rpi011@100.80.237.57
sudo tailscale funnel status

# Redémarrer Tailscale Funnel
sudo tailscale funnel --bg --https=443 --set-path=/ http://127.0.0.1:3001
```

## Migration Firebase → RPI (Terminée)

- ✅ Base de données PostgreSQL sur RPI
- ✅ API REST Node.js/Express
- ✅ Authentification JWT
- ✅ Composants frontend migrés (ContactsList, FichesList)
- ✅ Tailscale Funnel pour accès public
- ✅ Déploiement Vercel configuré
- ✅ Firebase complètement désactivé

## Coûts

- **Frontend (Vercel)**: Gratuit (Hobby plan)
- **Backend (RPI)**: 0€ (auto-hébergé)
- **Base de données**: 0€ (PostgreSQL sur RPI)
- **Tailscale**: Gratuit (plan personnel)

**Total: 0€/mois** 🎉
