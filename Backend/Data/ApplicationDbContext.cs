using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Models;

namespace Pfa1.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<Intervention> Interventions => Set<Intervention>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Contact> Contacts => Set<Contact>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.Phone).HasMaxLength(50);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(512);
            entity.Property(u => u.Role).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.CompanyName).IsRequired().HasMaxLength(200);
            entity.Property(c => c.ContactPerson).HasMaxLength(200);
            entity.Property(c => c.Email).HasMaxLength(256);
            entity.Property(c => c.Phone).HasMaxLength(50);
            entity.Property(c => c.Address).HasMaxLength(500);
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Type).HasMaxLength(100);
            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.Model).HasMaxLength(100);
            entity.Property(e => e.SerialNumber).HasMaxLength(100);
            entity.Property(e => e.PhotoUrl).HasMaxLength(500);
        });

        modelBuilder.Entity<Intervention>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Title).IsRequired().HasMaxLength(200);
            entity.Property(i => i.Description).HasMaxLength(2000);
            entity.Property(i => i.Priority).HasMaxLength(50);
            entity.Property(i => i.Status).HasMaxLength(50);
            entity.Property(i => i.Status).HasDefaultValue("Pending");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Cause).HasMaxLength(2000);
            entity.Property(r => r.Solution).HasMaxLength(2000);
            entity.Property(r => r.Duration).HasMaxLength(50);
            entity.Property(r => r.Notes).HasMaxLength(4000);
        });

        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Subject).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Message).IsRequired().HasMaxLength(4000);
            entity.Property(c => c.Status).IsRequired().HasMaxLength(50);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Email).IsRequired().HasMaxLength(256);
        });

        modelBuilder.Entity<Client>()
            .HasMany(c => c.Equipments)
            .WithOne(e => e.Client)
            .HasForeignKey(e => e.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Client>()
            .HasMany(c => c.Interventions)
            .WithOne(i => i.Client)
            .HasForeignKey(i => i.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Equipment>()
            .HasMany(e => e.Interventions)
            .WithOne(i => i.Equipment)
            .HasForeignKey(i => i.EquipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasMany(u => u.Interventions)
            .WithOne(i => i.Technician)
            .HasForeignKey(i => i.TechnicianId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Intervention>()
            .HasOne(i => i.Report)
            .WithOne(r => r.Intervention)
            .HasForeignKey<Report>(r => r.InterventionId)
            .OnDelete(DeleteBehavior.Cascade);
        
    }
}
