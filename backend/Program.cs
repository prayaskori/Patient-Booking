using Microsoft.EntityFrameworkCore;
using PatientBooking.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Services
builder.Services.AddControllers();

// Configure CORS for local development (default Vite ports: 3000, 5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDevServer", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure EF Core DbContext with dynamic fallback (SQLite locally, PostgreSQL in Prod/Azure)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<BookingDbContext>(options =>
{
    if (connectionString != null && (connectionString.Contains("Host=") || connectionString.Contains("Server=")))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlite(connectionString ?? "Data Source=patient_booking.db");
    }
});

// Add OpenAPI / Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Patient Appointment Booking API",
        Version = "v1",
        Description = "ASP.NET Core Web API for booking patient appointments with doctors."
    });
});

var app = builder.Build();

// 2. Configure HTTP Pipeline and Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Patient Booking API v1");
    });
}

app.UseCors("AllowFrontendDevServer");

app.UseAuthorization();

app.MapControllers();

// 3. Automated Database Migration on Startup
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
    
    // Automatically apply any pending migrations and create the database if it doesn't exist
    Console.WriteLine("Applying Entity Framework database migrations...");
    dbContext.Database.Migrate();
    Console.WriteLine("Database migrations successfully applied.");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"An error occurred while running database migrations: {ex.Message}");
}

app.Run();
