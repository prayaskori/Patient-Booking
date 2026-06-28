using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientBooking.Api.Data;

namespace PatientBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly BookingDbContext _context;

        public PatientsController(BookingDbContext context)
        {
            _context = context;
        }

        // GET: api/patients/{id}/appointments
        [HttpGet("{id}/appointments")]
        public async Task<IActionResult> GetPatientAppointments(int id)
        {
            // Verify if the patient exists first
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null)
            {
                return NotFound(new { Message = $"Patient with ID {id} not found." });
            }

            // Retrieve all appointments for this patient, ordered by date
            var appointments = await _context.Appointments
                .Where(a => a.PatientId == id)
                .OrderBy(a => a.DateTime)
                .ToListAsync();

            return Ok(new 
            { 
                PatientId = patient.Id,
                PatientName = patient.Name,
                PatientEmail = patient.Email,
                Appointments = appointments 
            });
        }
    }
}
