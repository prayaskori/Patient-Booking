using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PatientBooking.Api.Models
{
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PatientId { get; set; }

        [ForeignKey("PatientId")]
        public Patient? Patient { get; set; }

        [Required(ErrorMessage = "Doctor name is required.")]
        [StringLength(100, ErrorMessage = "Doctor name cannot exceed 100 characters.")]
        public string DoctorName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Appointment date and time is required.")]
        public DateTime DateTime { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Scheduled"; // Scheduled, Cancelled
    }
}
