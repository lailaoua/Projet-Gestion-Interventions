-- ============================================================
-- SCHEMA SQL COMPLET - PFA GESTION INTERVENTIONS MAINTENANCE
-- Base de données : Pfa1Db
-- SGBD : SQL Server
-- Généré automatiquement depuis Entity Framework Core
-- ============================================================

-- Suppression des tables existantes (dans l'ordre inverse des dépendances)
IF OBJECT_ID('dbo.Reports', 'U') IS NOT NULL DROP TABLE dbo.Reports;
IF OBJECT_ID('dbo.Interventions', 'U') IS NOT NULL DROP TABLE dbo.Interventions;
IF OBJECT_ID('dbo.Equipments', 'U') IS NOT NULL DROP TABLE dbo.Equipments;
IF OBJECT_ID('dbo.Contacts', 'U') IS NOT NULL DROP TABLE dbo.Contacts;
IF OBJECT_ID('dbo.Clients', 'U') IS NOT NULL DROP TABLE dbo.Clients;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;

-- ============================================================
-- TABLE : Users
-- Description : Utilisateurs du système (Admin, Technicien, Client)
-- ============================================================
CREATE TABLE dbo.Users (
    Id INT IDENTITY(1,1) NOT NULL,
    FullName NVARCHAR(200) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    Phone NVARCHAR(50) NULL,
    PasswordHash NVARCHAR(512) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Technician',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT CHK_Users_Role CHECK (Role IN ('Admin', 'Technician', 'Client'))
);

-- Index sur Email pour optimiser les recherches de connexion
CREATE INDEX IX_Users_Email ON dbo.Users(Email);

-- ============================================================
-- TABLE : Clients
-- Description : Entreprises clientes
-- ============================================================
CREATE TABLE dbo.Clients (
    Id INT IDENTITY(1,1) NOT NULL,
    CompanyName NVARCHAR(200) NOT NULL,
    ContactPerson NVARCHAR(200) NULL,
    Phone NVARCHAR(50) NULL,
    Email NVARCHAR(256) NULL,
    Address NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_Clients PRIMARY KEY CLUSTERED (Id)
);

-- ============================================================
-- TABLE : Equipments
-- Description : Équipements informatiques des clients
-- ============================================================
CREATE TABLE dbo.Equipments (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(100) NULL,
    Brand NVARCHAR(100) NULL,
    Model NVARCHAR(100) NULL,
    SerialNumber NVARCHAR(100) NULL,
    ClientId INT NULL,
    PhotoUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_Equipments PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Equipments_Clients FOREIGN KEY (ClientId)
        REFERENCES dbo.Clients(Id)
        ON DELETE CASCADE
);

-- Index pour optimiser les recherches par client
CREATE INDEX IX_Equipments_ClientId ON dbo.Equipments(ClientId);

-- ============================================================
-- TABLE : Contacts
-- Description : Messages et contacts des utilisateurs
-- ============================================================
CREATE TABLE dbo.Contacts (
    Id INT IDENTITY(1,1) NOT NULL,
    ClientId INT NULL,
    Name NVARCHAR(200) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    Subject NVARCHAR(200) NOT NULL,
    Message NVARCHAR(4000) NOT NULL,
    Response NVARCHAR(MAX) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'NonLu',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    RepliedAt DATETIME2 NULL,
    
    CONSTRAINT PK_Contacts PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Contacts_Clients FOREIGN KEY (ClientId)
        REFERENCES dbo.Clients(Id)
        ON DELETE NO ACTION,
    CONSTRAINT CHK_Contacts_Status CHECK (Status IN ('NonLu', 'Lu', 'Repondu'))
);

-- Index pour optimiser les recherches par client et statut
CREATE INDEX IX_Contacts_ClientId ON dbo.Contacts(ClientId);
CREATE INDEX IX_Contacts_Status ON dbo.Contacts(Status);

-- ============================================================
-- TABLE : Users (Techniciens)
-- Note : La table Users existe déjà, ajout des index pour interventions
-- ============================================================

-- ============================================================
-- TABLE : Interventions
-- Description : Interventions techniques de maintenance
-- ============================================================
CREATE TABLE dbo.Interventions (
    Id INT IDENTITY(1,1) NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000) NULL,
    Priority NVARCHAR(50) NOT NULL DEFAULT 'Normal',
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ClientId INT NOT NULL,
    EquipmentId INT NOT NULL,
    TechnicianId INT NULL,
    
    CONSTRAINT PK_Interventions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Interventions_Clients FOREIGN KEY (ClientId)
        REFERENCES dbo.Clients(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_Interventions_Equipments FOREIGN KEY (EquipmentId)
        REFERENCES dbo.Equipments(Id)
        ON DELETE NO ACTION,
    CONSTRAINT FK_Interventions_Users FOREIGN KEY (TechnicianId)
        REFERENCES dbo.Users(Id)
        ON DELETE SET NULL
);

-- Index pour optimiser les recherches
CREATE INDEX IX_Interventions_ClientId ON dbo.Interventions(ClientId);
CREATE INDEX IX_Interventions_EquipmentId ON dbo.Interventions(EquipmentId);
CREATE INDEX IX_Interventions_TechnicianId ON dbo.Interventions(TechnicianId);
CREATE INDEX IX_Interventions_Status ON dbo.Interventions(Status);
CREATE INDEX IX_Interventions_Priority ON dbo.Interventions(Priority);

-- ============================================================
-- TABLE : Reports
-- Description : Rapports détaillés des interventions
-- ============================================================
CREATE TABLE dbo.Reports (
    Id INT IDENTITY(1,1) NOT NULL,
    InterventionId INT NOT NULL UNIQUE,
    Cause NVARCHAR(2000) NULL,
    Diagnostic NVARCHAR(MAX) NULL,
    Solution NVARCHAR(2000) NULL,
    PartsReplaced NVARCHAR(MAX) NULL,
    TestsPerformed NVARCHAR(MAX) NULL,
    Duration NVARCHAR(50) NULL,
    StartTime NVARCHAR(50) NULL,
    EndTime NVARCHAR(50) NULL,
    Notes NVARCHAR(4000) NULL,
    Recommendations NVARCHAR(MAX) NULL,
    ReportDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT PK_Reports PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Reports_Interventions FOREIGN KEY (InterventionId)
        REFERENCES dbo.Interventions(Id)
        ON DELETE CASCADE
);

-- Index pour optimiser les recherches par intervention
CREATE INDEX IX_Reports_InterventionId ON dbo.Reports(InterventionId);

-- ============================================================
-- DONNÉES DE DÉMARRAGE (SEED DATA)
-- ============================================================

-- Insertion d'un utilisateur Admin par défaut
INSERT INTO dbo.Users (FullName, Email, Phone, PasswordHash, Role, CreatedAt)
VALUES (
    'Administrateur Système',
    'admin@pfa1.com',
    '+212600000000',
    'AQAAAAEAACcQAAAAEJZz5Y5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X', -- Hash à remplacer
    'Admin',
    GETUTCDATE()
);

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
