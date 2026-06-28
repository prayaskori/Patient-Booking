using Microsoft.EntityFrameworkCore;
using PatientBooking.Api.Models;

namespace PatientBooking.Api.Data
{
    public class BookingDbContext : DbContext
    {
        public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options)
        {
        }

        public DbSet<Patient> Patients { get; set; } = null!;
        public DbSet<Appointment> Appointments { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure one-to-many relationship
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed sample data for Patients
            modelBuilder.Entity<Patient>().HasData(
                new Patient { Id = 1, Name = "John Doe", Email = "john.doe@example.com" },
                new Patient { Id = 2, Name = "Jane Smith", Email = "jane.smith@example.com" }
            );

            // Seed sample data for Appointments
            modelBuilder.Entity<Appointment>().HasData(
                new Appointment 
                { 
                    Id = 1, 
                    PatientId = 1, 
                    DoctorName = "Dr. Alice Smith", 
                    DateTime = DateTime.SpecifyKind(new DateTime(2026, 7, 10, 10, 0, 0), DateTimeKind.Utc), 
                    Status = "Scheduled" 
                },
                new Appointment 
                { 
                    Id = 2, 
                    PatientId = 2, 
                    DoctorName = "Dr. Bob Johnson", 
                    DateTime = DateTime.SpecifyKind(new DateTime(2026, 7, 12, 14, 30, 0), DateTimeKind.Utc), 
                    Status = "Scheduled" 
                }
            );
        }
    }
}
