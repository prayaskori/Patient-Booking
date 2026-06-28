using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientBooking.Api.Data;
using PatientBooking.Api.Models;

namespace PatientBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly BookingDbContext _context;

        public AppointmentsController(BookingDbContext context)
        {
            _context = context;
        }

        // POST: api/appointments
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] BookAppointmentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.DateTime <= DateTime.UtcNow)
            {
                return BadRequest(new { Message = "Appointment date and time must be in the future." });
            }

            try
            {
                // Clean input
                var email = request.PatientEmail.Trim().ToLower();
                var name = request.PatientName.Trim();

                // Find or create patient
                var patient = await _context.Patients
                    .FirstOrDefaultAsync(p => p.Email == email);

                if (patient == null)
                {
                    patient = new Patient
                    {
                        Name = name,
                        Email = email
                    };
                    _context.Patients.Add(patient);
                    await _context.SaveChangesAsync(); // Save to generate patient ID
                }

                // Create appointment
                var appointment = new Appointment
                {
                    PatientId = patient.Id,
                    DoctorName = request.DoctorName.Trim(),
                    DateTime = DateTime.SpecifyKind(request.DateTime, DateTimeKind.Utc),
                    Status = "Scheduled"
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                // Load patient relation for return value
                appointment.Patient = patient;

                return CreatedAtAction(nameof(GetAppointmentById), new { id = appointment.Id }, appointment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while creating the appointment.", Error = ex.Message });
            }
        }

        // GET: api/appointments/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAppointmentById(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
            {
                return NotFound(new { Message = $"Appointment with ID {id} not found." });
            }

            return Ok(appointment);
        }

        // DELETE: api/appointments/{id}
        // Soft cancels the appointment by setting Status to "Cancelled"
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelAppointment(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
            {
                return NotFound(new { Message = $"Appointment with ID {id} not found." });
            }

            if (appointment.Status == "Cancelled")
            {
                return BadRequest(new { Message = "Appointment is already cancelled." });
            }

            appointment.Status = "Cancelled";
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Appointment successfully cancelled.", Appointment = appointment });
        }
    }

    public class BookAppointmentRequest
    {
        [Required(ErrorMessage = "Patient name is required.")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
        public string PatientName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Patient email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        public string PatientEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Doctor name is required.")]
        [StringLength(100, ErrorMessage = "Doctor name cannot exceed 100 characters.")]
        public string DoctorName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Appointment date and time is required.")]
        public DateTime DateTime { get; set; }
    }
}
