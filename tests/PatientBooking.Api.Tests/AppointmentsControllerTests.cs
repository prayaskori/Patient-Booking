using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PatientBooking.Api.Controllers;
using PatientBooking.Api.Data;
using PatientBooking.Api.Models;
using Xunit;

namespace PatientBooking.Api.Tests
{
    public class AppointmentsControllerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly DbContextOptions<BookingDbContext> _contextOptions;

        public AppointmentsControllerTests()
        {
            // Create a SQLite connection in-memory
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            _contextOptions = new DbContextOptionsBuilder<BookingDbContext>()
                .UseSqlite(_connection)
                .Options;

            // Construct the database schema for the test instance
            using var context = new BookingDbContext(_contextOptions);
            context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _connection.Dispose();
        }

        [Fact]
        public async Task CreateAppointment_ValidInput_ReturnsCreatedAtAction()
        {
            // Arrange
            using var context = new BookingDbContext(_contextOptions);
            var controller = new AppointmentsController(context);

            var request = new BookAppointmentRequest
            {
                PatientName = "Sarah Connor",
                PatientEmail = "sarah.c@example.com",
                DoctorName = "Dr. Alice Smith",
                DateTime = DateTime.UtcNow.AddDays(5) // Future date
            };

            // Act
            var result = await controller.CreateAppointment(request);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var appointment = Assert.IsType<Appointment>(createdResult.Value);
            
            Assert.Equal("Scheduled", appointment.Status);
            Assert.Equal("Dr. Alice Smith", appointment.DoctorName);
            Assert.NotNull(appointment.Patient);
            Assert.Equal("Sarah Connor", appointment.Patient.Name);
            Assert.Equal("sarah.c@example.com", appointment.Patient.Email);

            // Verify database contains the record
            var dbAppointment = await context.Appointments.Include(a => a.Patient).FirstOrDefaultAsync(a => a.Id == appointment.Id);
            Assert.NotNull(dbAppointment);
            Assert.Equal("sarah.c@example.com", dbAppointment.Patient?.Email);
        }

        [Fact]
        public async Task CreateAppointment_PastDateTime_ReturnsBadRequest()
        {
            // Arrange
            using var context = new BookingDbContext(_contextOptions);
            var controller = new AppointmentsController(context);

            var request = new BookAppointmentRequest
            {
                PatientName = "Sarah Connor",
                PatientEmail = "sarah.c@example.com",
                DoctorName = "Dr. Alice Smith",
                DateTime = DateTime.UtcNow.AddDays(-1) // Past date
            };

            // Act
            var result = await controller.CreateAppointment(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);
        }
    }
}
