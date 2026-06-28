using Microsoft.EntityFrameworkCore;
using PatientBooking.Api.Data;

Console.WriteLine("Starting CareSync API...");
Console.WriteLine("DATABASE_URL exists: " + 
    (Environment.GetEnvironmentVariable("DATABASE_URL") != null));
Console.WriteLine("PORT: " + 
    (Environment.GetEnvironmentVariable("PORT") ?? "not set"));

try
{
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
        ?? builder.Configuration.GetConnectionString("DefaultConnection");

    if (connectionString != null && (connectionString.StartsWith("postgresql://") || 
        connectionString.StartsWith("postgres://")))
    {
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':');
        connectionString = $"Host={uri.Host};Port={uri.Port};" +
            $"Database={uri.AbsolutePath.TrimStart('/')};" +
            $"Username={userInfo[0]};Password={userInfo[1]};" +
            $"SSL Mode=Require;Trust Server Certificate=true";
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

    // Configure dynamic PORT for Railway
    var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    app.Urls.Add($"http://0.0.0.0:{port}");

    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("FATAL ERROR: " + ex.ToString());
    throw;
}
