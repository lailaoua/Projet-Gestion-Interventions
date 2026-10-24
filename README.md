# Projet-Gestion-Interventions

Application web de gestion des interventions et de la maintenance informatique, développée avec React, ASP.NET Core Web API, Entity Framework Core et SQL Server.

## Description
Projet PFA pour gérer les clients, les équipements, les interventions techniques, les techniciens et les rapports de maintenance.

## Structure
- `Backend/` : ASP.NET Core 8 Web API
- `Frontend/` : React.js single-page app

## Backend
Depuis le dossier `Backend` :

```powershell
dotnet restore
dotnet run
```

Les migrations sont appliquées au démarrage. La configuration par défaut utilise SQL Server LocalDB.

## Frontend
Depuis le dossier `Frontend` :

```powershell
npm ci
npm start
```

## Notes
- Le backend utilise JWT pour l'authentification.
- La base de données attend une chaîne de connexion SQL Server dans `Backend/appsettings.json`.
- Le frontend utilise `axios`, `react-router-dom`, `bootstrap` et `chart.js`.
- Pour tout déploiement, définir une clé JWT forte avec la variable `JwtSettings__SecretKey` et ne pas utiliser la clé de développement fournie.
