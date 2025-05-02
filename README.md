# 🕹️ Transcendance

Transcendance est une application web de type **Pong multijoueur**, développée dans le cadre du cursus 42.  
Elle comprend une architecture **fullstack** basée sur Angular (frontend) et NestJS (backend), le tout orchestré avec Docker.

## 👥 Equipe

- Yan Baudouin
- Kévin Brousse
- Arthur Chretien
- Jordan Sauvain

## 🔧 Setup Instructions

Remplir le fichier .env:

```
POSTGRES_USER=XXXXX
POSTGRES_PASSWORD=XXXXX
POSTGRES_DB=XXXXX
JWT_SECRET=XXXXX
POSTGRES_USER=XXXXX
POSTGRES_PASSWORD=XXXXX
POSTGRES_DB=XXXXX
SENDGRID_API_KEY=XXXXX
SENDGRID_API_KEY_ID=XXXXX
APP_UID=XXXXX
APP_SECRET=XXXXX
```

## 🛠️ Technologies

- Frontend : [Angular](https://angular.io/)
- Backend : [NestJS](https://nestjs.com/)
- Auth : OAuth2 (via API 42)
- Containerisation : Docker, Docker Compose
- Base de données : PostgreSQL

## 🚀 Lancer le projet en local

### 1. Cloner le repo

```bash
git clone https://github.com/<user>/transcendance.git
cd transcendence
```

### 2. Run l'application
```
make
```

### 3. Accéder à l'application via un navigateur
```
http://localhost:4200
```
