# RAPPORT PFA - Application Web de Gestion des Interventions et Maintenance Informatique

---

## 1. INTRODUCTION

### 1.1 Contexte du Projet
Ce projet de Projet de Fin d'Année (PFA) consiste en une application web complète pour la gestion des interventions techniques et de la maintenance informatique. L'application permet de gérer les clients, les équipements, les interventions, les techniciens et les rapports de maintenance de manière centralisée et efficace.

### 1.2 Objectifs
- Centraliser la gestion des clients et de leurs équipements
- Faciliter le suivi des interventions techniques
- Permettre la génération de rapports de maintenance détaillés
- Offrir une interface utilisateur intuitive pour différents rôles (Admin, Technicien, Client)
- Assurer la sécurité des données via une authentification robuste

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Architecture Globale
L'application adopte une architecture client-serveur moderne avec une séparation claire entre le frontend et le backend :

- **Backend** : API RESTful développée avec ASP.NET Core 8
- **Frontend** : Application Single Page Application (SPA) avec React.js
- **Base de données** : SQL Server (LocalDB)
- **Communication** : Protocole HTTP avec JSON
- **Authentification** : JWT (JSON Web Tokens)

### 2.2 Stack Technique

#### Backend
- **Framework** : ASP.NET Core 8
- **Langage** : C#
- **ORM** : Entity Framework Core
- **Base de données** : SQL Server LocalDB
- **Authentification** : JWT Bearer
- **Génération PDF** : QuestPDF
- **Documentation API** : Swagger/OpenABI
- **CORS** : Configuration pour autoriser le frontend

#### Frontend
- **Framework** : React.js 18.3
- **Langage** : JavaScript (ES6+)
- **Routing** : React Router DOM 6.16
- **HTTP Client** : Axios 1.4
- **UI Framework** : Bootstrap 5.3
- **Graphiques** : Chart.js 4.5 + React Chart.js 2
- **Icônes** : Lucide React
- **Utilitaires** : Underscore.js

---

## 3. MODÉLISATION DES DONNÉES

### 3.1 Schéma de la Base de Données

L'application utilise six modèles principaux :

#### Client
- `Id` : Identifiant unique
- `CompanyName` : Nom de l'entreprise (requis)
- `ContactPerson` : Personne de contact
- `Phone` : Numéro de téléphone
- `Email` : Adresse email
- `Address` : Adresse postale
- `CreatedAt` : Date de création
- **Relations** : Plusieurs équipements, plusieurs interventions

#### Equipment
- `Id` : Identifiant unique
- `Name` : Nom de l'équipement (requis)
- `Type` : Type d'équipement
- `Brand` : Marque
- `Model` : Modèle
- `SerialNumber` : Numéro de série
- `ClientId` : Clé étrangère vers Client
- `CreatedAt` : Date de création
- `PhotoUrl` : URL de la photo de l'équipement
- **Relations** : Un client, plusieurs interventions

#### Intervention
- `Id` : Identifiant unique
- `Title` : Titre de l'intervention (requis)
- `Description` : Description détaillée
- `Priority` : Priorité (Normal, Haute, Urgente)
- `Status` : Statut (Pending, InProgress, Completed)
- `CreatedAt` : Date de création
- `ClientId` : Clé étrangère vers Client
- `EquipmentId` : Clé étrangère vers Equipment
- `TechnicianId` : Clé étrangère vers User (Technicien)
- **Relations** : Un client, un équipement, un technicien, un rapport

#### Report
- `Id` : Identifiant unique
- `InterventionId` : Clé étrangère vers Intervention
- `Cause` : Cause du problème
- `Diagnostic` : Diagnostic effectué
- `Solution` : Solution appliquée
- `PartsReplaced` : Pièces remplacées
- `TestsPerformed` : Tests effectués
- `Duration` : Durée de l'intervention
- `StartTime` : Heure de début
- `EndTime` : Heure de fin
- `Notes` : Notes additionnelles
- `Recommendations` : Recommandations
- `ReportDate` : Date du rapport
- **Relations** : Une intervention

#### User
- `Id` : Identifiant unique
- `FullName` : Nom complet (requis)
- `Email` : Email (requis, unique)
- `Phone` : Numéro de téléphone
- `PasswordHash` : Mot de passe haché (requis)
- `Role` : Rôle (Admin, Technician, Client)
- `CreatedAt` : Date de création
- **Relations** : Plusieurs interventions (si technicien)

#### Contact
- Modèle pour la gestion des contacts et messages
- Permet la communication entre les différents utilisateurs

### 3.2 Diagramme Entité-Association
```
Client (1) ----< (N) Equipment
  |                     |
  +----< (N) Intervention >---- (1) Equipment
  |                     |
  +----< (N) Intervention >---- (N) User (Technician)
                          |
                          >---- (1) Report
```

---

## 4. FONCTIONNALITÉS

### 4.1 Authentification et Autorisation
- **Connexion sécurisée** via JWT
- **Trois rôles utilisateurs** :
  - **Admin** : Accès complet à toutes les fonctionnalités
  - **Technician** : Gestion des interventions et rapports
  - **Client** : Consultation de ses équipements et interventions
- **Protection des routes** par rôle
- **Gestion des sessions** avec tokens JWT

### 4.2 Gestion des Clients
- CRUD complet (Créer, Lire, Mettre à jour, Supprimer)
- Liste des clients avec recherche et filtrage
- Détails complets du client (entreprise, contact, coordonnées)
- Historique des interventions par client
- Gestion des équipements par client

### 4.3 Gestion des Équipements
- CRUD complet pour les équipements
- Association avec les clients
- Informations détaillées (marque, modèle, numéro de série)
- Upload de photos d'équipements
- Historique des interventions par équipement
- Recherche et filtrage

### 4.4 Gestion des Interventions
- Création d'interventions avec priorité et statut
- Assignation aux techniciens
- Suivi du statut (Pending, InProgress, Completed)
- Association avec clients et équipements
- Historique complet des interventions
- Filtrage par statut, priorité, technicien, client

### 4.5 Gestion des Rapports
- Génération de rapports détaillés pour chaque intervention
- Sections : Cause, Diagnostic, Solution, Pièces remplacées, Tests
- Informations temporelles (durée, heure début/fin)
- Recommandations et notes
- Export en PDF via QuestPDF
- Consultation et téléchargement des rapports

### 4.6 Tableaux de Bord
- **Dashboard Admin** :
  - Vue d'ensemble globale
  - Statistiques sur les interventions
  - Analytics avancés
  - Gestion des utilisateurs

- **Dashboard Technicien** :
  - Interventions assignées
  - Statistiques personnelles
  - Rapports à générer

- **Dashboard Client** :
  - Équipements personnels
  - Historique des interventions
  - Statut des interventions en cours

### 4.7 Statistiques et Analytics
- Graphiques de visualisation des données
- Statistiques sur les interventions par statut
- Répartition par priorité
- Performance des techniciens
- Tendances temporelles
- Export de données

### 4.8 Gestion des Utilisateurs
- Création de comptes utilisateurs
- Attribution des rôles
- Gestion des profils
- Informations de contact

### 4.9 Système de Contact
- Messagerie interne
- Communication entre utilisateurs
- Historique des messages

---

## 5. INTERFACE UTILISATEUR

### 5.1 Structure de l'Application Frontend
L'application React est organisée en plusieurs pages et composants :

#### Pages Principales
- `LoginPage` : Page de connexion
- `AdminDashboard` : Dashboard administrateur
- `TechnicianDashboard` : Dashboard technicien
- `ClientDashboard` : Dashboard client
- `ClientsPage` : Gestion des clients
- `EquipmentsPage` : Gestion des équipements
- `InterventionsPage` : Gestion des interventions
- `ReportsPage` : Liste des rapports
- `ReportDetailsPage` : Détails d'un rapport
- `UsersPage` : Gestion des utilisateurs
- Pages de profil pour chaque rôle
- Pages de statistiques
- Pages de contact

#### Composants
- `Navbar` : Barre de navigation
- `Loading` : Composant de chargement
- `Toast` : Notifications

#### Services
- Services API pour chaque entité (Clients, Equipments, Interventions, etc.)
- Service d'authentification
- Contexte d'authentification

### 5.2 Design et UX
- Interface responsive avec Bootstrap 5
- Navigation intuitive par rôle
- Feedback visuel (chargement, notifications)
- Formulaires validés
- Tableaux de données avec filtrage
- Graphiques interactifs avec Chart.js

---

## 6. API BACKEND

### 6.1 Contrôleurs
L'API expose plusieurs contrôleurs RESTful :

#### AuthController
- `POST /api/auth/login` : Authentification et génération de token JWT
- `POST /api/auth/register` : Création d'un nouvel utilisateur

#### ClientsController
- `GET /api/clients` : Liste des clients
- `GET /api/clients/{id}` : Détails d'un client
- `POST /api/clients` : Création d'un client
- `PUT /api/clients/{id}` : Mise à jour d'un client
- `DELETE /api/clients/{id}` : Suppression d'un client

#### EquipmentsController
- `GET /api/equipments` : Liste des équipements
- `GET /api/equipments/{id}` : Détails d'un équipement
- `POST /api/equipments` : Création d'un équipement
- `PUT /api/equipments/{id}` : Mise à jour d'un équipement
- `DELETE /api/equipments/{id}` : Suppression d'un équipement
- `POST /api/equipments/{id}/photo` : Upload de photo

#### InterventionsController
- `GET /api/interventions` : Liste des interventions
- `GET /api/interventions/{id}` : Détails d'une intervention
- `POST /api/interventions` : Création d'une intervention
- `PUT /api/interventions/{id}` : Mise à jour d'une intervention
- `DELETE /api/interventions/{id}` : Suppression d'une intervention
- `PUT /api/interventions/{id}/assign` : Assignation à un technicien
- `PUT /api/interventions/{id}/status` : Changement de statut

#### ReportsController
- `GET /api/reports` : Liste des rapports
- `GET /api/reports/{id}` : Détails d'un rapport
- `POST /api/reports` : Création d'un rapport
- `PUT /api/reports/{id}` : Mise à jour d'un rapport
- `DELETE /api/reports/{id}` : Suppression d'un rapport
- `GET /api/reports/{id}/pdf` : Génération PDF

#### DashboardController
- `GET /api/dashboard/stats` : Statistiques globales
- `GET /api/dashboard/analytics` : Données analytiques

#### UsersController
- `GET /api/users` : Liste des utilisateurs
- `POST /api/users` : Création d'utilisateur
- `PUT /api/users/{id}` : Mise à jour d'utilisateur
- `DELETE /api/users/{id}` : Suppression d'utilisateur

#### ContactController
- `GET /api/contacts` : Liste des messages
- `POST /api/contacts` : Envoi de message

### 6.2 Sécurité
- Authentification JWT Bearer
- Configuration CORS pour le frontend
- Validation des données avec Data Annotations
- Hachage des mots de passe
- Protection par rôle sur les endpoints

---

## 7. DÉPLOIEMENT ET INSTALLATION

### 7.1 Prérequis
- **Backend** :
  - .NET 8 SDK
  - SQL Server LocalDB ou SQL Server

- **Frontend** :
  - Node.js (v16 ou supérieur)
  - npm ou yarn

### 7.2 Installation Backend
```bash
cd Backend
dotnet restore
dotnet run
```
L'API sera accessible sur `http://localhost:5000` (configuré dans appsettings.json)
Swagger UI disponible sur `http://localhost:5000/swagger`

### 7.3 Installation Frontend
```bash
cd Frontend
npm install
npm start
```
L'application sera accessible sur `http://localhost:3000`

### 7.4 Configuration Base de Données
La chaîne de connexion est configurée dans `Backend/appsettings.json` :
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=Pfa1Db;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

Les migrations sont appliquées automatiquement au démarrage via `context.Database.Migrate()`

---

## 8. CONCLUSION

### 8.1 Réalisations
Ce projet PFA a permis de développer une application web complète et fonctionnelle pour la gestion des interventions techniques de maintenance informatique. Les principaux accomplissements sont :

- Architecture moderne et scalable (ASP.NET Core + React)
- Base de données bien structurée avec Entity Framework Core
- Authentification sécurisée via JWT
- Interface utilisateur intuitive et responsive
- Fonctionnalités complètes pour chaque rôle utilisateur
- Génération de rapports PDF professionnels
- Statistiques et visualisation des données
- Documentation API avec Swagger

### 8.2 Points Forts
- Séparation claire des responsabilités (Frontend/Backend)
- Code maintenable et bien structuré
- Sécurité des données
- Expérience utilisateur optimisée
- Extensibilité facilitée par l'architecture modulaire

### 8.3 Perspectives d'Amélioration
- Ajout de notifications en temps réel (SignalR)
- Intégration d'un système de tickets
- Mobile application (React Native)
- Export de données en Excel
- Système de notifications par email
- Intégration avec des outils de gestion de projet
- Tests automatisés complets
- CI/CD pipeline

---

**Date du rapport** : 20 juillet 2026
**Technologies utilisées** : ASP.NET Core 8, React.js 18, SQL Server, Entity Framework Core, JWT, QuestPDF, Chart.js
**Type de projet** : Application Web de Gestion (Full Stack)
