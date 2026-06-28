using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PatientBooking.Api.Models
{
    public class Patient
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Patient name is required.")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        public string Email { get; set; } = string.Empty;

        // Navigation property for EF Core
        [JsonIgnore]
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }
}
