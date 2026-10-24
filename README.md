# PFA - Application Web de Gestion des Interventions et Maintenance Informatique

## Description
Projet PFA pour la gestion des clients, des équipements, des interventions techniques, des techniciens et des rapports de maintenance.

## Structure
- `Backend/` : ASP.NET Core 8 Web API
- `Frontend/` : React.js single-page app

## Backend
1. Ouvrir une console dans `Backend`
2. Restaurer les packages : `dotnet restore`
3. Appliquer les migrations et démarrer l'API : `dotnet run`

## Frontend
1. Ouvrir une console dans `Frontend`
2. Installer les dépendances : `npm install`
3. Lancer l'application : `npm start`

## Notes
- Le backend utilise JWT pour l'authentification.
- La base de données attend une chaîne de connexion SQL Server dans `Backend/appsettings.json`.
- Le frontend utilise `axios`, `react-router-dom`, `bootstrap` et `chart.js`.
