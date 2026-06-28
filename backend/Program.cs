using Microsoft.EntityFrameworkCore;
using PatientBooking.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Services
builder.Services.AddControllers();

// Configure CORS to allow any origin (wildcard) for Railway deployments
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDevServer", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Retrieve connection string from Environment Variables or AppSettings
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") 
                      ?? Environment.GetEnvironmentVariable("CONNECTION_STRING")
                      ?? builder.Configuration.GetConnectionString("DefaultConnection");

// Parse Railway postgres:// URI format if present
if (connectionString != null && connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
{
    try
    {
        var databaseUri = new Uri(connectionString);
        var userInfo = databaseUri.UserInfo.Split(':');
        var user = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var host = databaseUri.Host;
        var port = databaseUri.Port == -1 ? 5432 : databaseUri.Port;
        var database = databaseUri.LocalPath.TrimStart('/');
        
        connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Error parsing DATABASE_URL URI: {ex.Message}");
    }
}

// Configure EF Core DbContext with dynamic fallback (SQLite locally, PostgreSQL in Prod/Azure/Railway)
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
