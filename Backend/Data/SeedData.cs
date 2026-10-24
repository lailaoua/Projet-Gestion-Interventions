using Pfa1.Api.Models;
using System;
using System.Security.Cryptography;
using System.Text;

namespace Pfa1.Api.Data;

public static class SeedData
{
    public static void Initialize(ApplicationDbContext context)
    {
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "Pfa12345!";
        var technicianPassword = Environment.GetEnvironmentVariable("TECHNICIAN_PASSWORD") ?? adminPassword;
        var clientPassword = Environment.GetEnvironmentVariable("CLIENT_PASSWORD") ?? adminPassword;

        var adminEmail = "admin@pfa.local";
        var technicianEmail1 = "technician@pfa.local";
        var technicianEmail2 = "technician2@pfa.local";
        var clientEmail1 = "client@pfa.local";
        var clientEmail2 = "client2@pfa.local";

        var admin = context.Users.FirstOrDefault(u => u.Email == adminEmail);
        if (admin == null)
        {
            admin = new User
            {
                FullName = "Admin PFA",
                Email = adminEmail,
                Role = "Admin",
                PasswordHash = ComputeHash(adminPassword)
            };
            context.Users.Add(admin);
        }
        else
        {
            admin.FullName = "Admin PFA";
            admin.Role = "Admin";
            admin.PasswordHash = ComputeHash(adminPassword);
        }

        var technician1 = context.Users.FirstOrDefault(u => u.Email == technicianEmail1);
        if (technician1 == null)
        {
            technician1 = new User
            {
                FullName = "Technicien PFA 1",
                Email = technicianEmail1,
                Role = "Technician",
                PasswordHash = ComputeHash(technicianPassword)
            };
            context.Users.Add(technician1);
        }
        else
        {
            technician1.FullName = "Technicien PFA 1";
            technician1.Role = "Technician";
            technician1.PasswordHash = ComputeHash(technicianPassword);
        }

        var technician2 = context.Users.FirstOrDefault(u => u.Email == technicianEmail2);
        if (technician2 == null)
        {
            technician2 = new User
            {
                FullName = "Technicien PFA 2",
                Email = technicianEmail2,
                Role = "Technician",
                PasswordHash = ComputeHash(technicianPassword)
            };
            context.Users.Add(technician2);
        }
        else
        {
            technician2.FullName = "Technicien PFA 2";
            technician2.Role = "Technician";
            technician2.PasswordHash = ComputeHash(technicianPassword);
        }

        var clientUser1 = context.Users.FirstOrDefault(u => u.Email == clientEmail1);
        if (clientUser1 == null)
        {
            clientUser1 = new User
            {
                FullName = "Client Demo",
                Email = clientEmail1,
                Role = "Client",
                PasswordHash = ComputeHash(clientPassword)
            };
            context.Users.Add(clientUser1);
        }
        else
        {
            clientUser1.FullName = "Client Demo";
            clientUser1.Role = "Client";
            clientUser1.PasswordHash = ComputeHash(clientPassword);
        }

        var clientUser2 = context.Users.FirstOrDefault(u => u.Email == clientEmail2);
        if (clientUser2 == null)
        {
            clientUser2 = new User
            {
                FullName = "Client Entreprise",
                Email = clientEmail2,
                Role = "Client",
                PasswordHash = ComputeHash(clientPassword)
            };
            context.Users.Add(clientUser2);
        }
        else
        {
            clientUser2.FullName = "Client Entreprise";
            clientUser2.Role = "Client";
            clientUser2.PasswordHash = ComputeHash(clientPassword);
        }

        context.SaveChanges();

        var client1 = context.Clients.FirstOrDefault(c => c.Email == clientEmail1);
        if (client1 == null)
        {
            client1 = new Client
            {
                CompanyName = "Entreprise Demo",
                ContactPerson = "Client Demo",
                Email = clientEmail1,
                Phone = "0123456789",
                Address = "123 rue de la Maintenance"
            };
            context.Clients.Add(client1);
        }

        var client2 = context.Clients.FirstOrDefault(c => c.Email == clientEmail2);
        if (client2 == null)
        {
            client2 = new Client
            {
                CompanyName = "Acme Industrie",
                ContactPerson = "Client Entreprise",
                Email = clientEmail2,
                Phone = "0147258369",
                Address = "45 avenue des Machines"
            };
            context.Clients.Add(client2);
        }

        context.SaveChanges();

        var equipment1 = context.Equipments.FirstOrDefault(e => e.SerialNumber == "SN-1001");
        if (equipment1 == null)
        {
            equipment1 = new Equipment
            {
                Name = "Serveur de production",
                Type = "Serveur",
                Brand = "Dell",
                Model = "PowerEdge",
                SerialNumber = "SN-1001",
                ClientId = client1!.Id,
                PhotoUrl = "/uploads/server.jpg"
            };
            context.Equipments.Add(equipment1);
        }

        var equipment2 = context.Equipments.FirstOrDefault(e => e.SerialNumber == "SN-1002");
        if (equipment2 == null)
        {
            equipment2 = new Equipment
            {
                Name = "Imprimante réseau",
                Type = "Imprimante",
                Brand = "HP",
                Model = "LaserJet 4000",
                SerialNumber = "SN-1002",
                ClientId = client2!.Id,
                PhotoUrl = "/uploads/printer.jpg"
            };
            context.Equipments.Add(equipment2);
        }

        context.SaveChanges();

        var intervention1 = context.Interventions.FirstOrDefault(i => i.Title == "Inspection préventive serveur");
        if (intervention1 == null)
        {
            context.Interventions.Add(new Intervention
            {
                Title = "Inspection préventive serveur",
                Description = "Vérification générale du serveur de production.",
                Priority = "Haute",
                Status = "En attente",
                ClientId = client1!.Id,
                EquipmentId = equipment1.Id,
                TechnicianId = technician1!.Id
            });
        }

        var intervention2 = context.Interventions.FirstOrDefault(i => i.Title == "Réparation imprimante réseau");
        if (intervention2 == null)
        {
            context.Interventions.Add(new Intervention
            {
                Title = "Réparation imprimante réseau",
                Description = "Remplacement du bac papier et nettoyage du capteur.",
                Priority = "Normale",
                Status = "En cours",
                ClientId = client2!.Id,
                EquipmentId = equipment2.Id,
                TechnicianId = technician2!.Id
            });
        }

        context.SaveChanges();
    }

    private static string ComputeHash(string input)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}
