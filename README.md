# Patient Appointment Booking Application

A modern, full-stack portfolio application for booking patient appointments. Built using **ASP.NET Core 8 Web API** for the backend, **PostgreSQL** with Entity Framework Core for data storage, and **React + Vite + Tailwind CSS v3** for the frontend.

## Features
- **Book Appointment Form:** Easily input patient name, email, doctor name, and appointment date/time. Creates patient profiles automatically if they don't exist.
- **Search Patient Appointments:** Search and view all appointments by Patient ID.
- **Cancel Appointments:** Instantly cancel appointments (sets status to `"Cancelled"`).
- **Automated Database Setup:** Automatically creates and migrates PostgreSQL database tables on backend startup.

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js (v18+) & npm](https://nodejs.org/)
- [PostgreSQL Database Server](https://www.postgresql.org/download/)

### 2. Database Configuration
1. Ensure your local PostgreSQL server is running.
2. The backend connects to PostgreSQL using the connection string defined in `backend/appsettings.json`. By default, it is:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Database=patient_booking_db;Username=postgres;Password=postgres"
   }
   ```
3. Update the `Username` and `Password` in `backend/appsettings.json` if your local PostgreSQL credentials differ.

### 3. Run the Backend API
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Restore dependencies and run the application:
   ```bash
   dotnet run
   ```
3. The server will launch (typically at `http://localhost:5247` or check your terminal output).
4. Entity Framework migrations will run **automatically on startup** to create the `patient_booking_db` database and its tables.
5. You can view the API documentation (Swagger) at: `http://localhost:5247/swagger` (replace port with your actual running port).

### 4. Run the Frontend App
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server on port `3000` (which is configured for CORS on the API):
   ```bash
   npm run dev -- --port 3000
   ```
4. Open your browser and navigate to `http://localhost:3000`.

---

## 🚀 Azure Deployment Steps

To deploy this full-stack application to production on Microsoft Azure, follow these instructions:

### Part 1: Deploy PostgreSQL Database
1. Go to the [Azure Portal](https://portal.azure.com/) and search for **Azure Database for PostgreSQL flexible server**.
2. Click **Create** and configure:
   - **Compute + storage:** Choose a Burstable/Development tier (e.g., Standard_B1ms) for cost savings.
   - **Admin username** & **password**.
3. Under **Networking**, enable **Allow public access from any Azure service within Azure** so the backend Web API can connect.
4. Save the server connection string. It will look like:
   `Server=<your-db-server>.postgres.database.azure.com;Database=patient_booking_db;Port=5432;User Id=<username>;Password=<password>;Ssl Mode=Require;`

### Part 2: Deploy Backend ASP.NET Core API
1. Search for **App Service** in the Azure Portal and click **Create -> Web App**.
2. Configure settings:
   - **Runtime Stack:** .NET 8 (LTS)
   - **Operating System:** Linux (recommended) or Windows
3. Once created, go to **Configuration** (under Settings) and add a new Connection String:
   - **Name:** `DefaultConnection`
   - **Value:** Your Azure PostgreSQL connection string (compiled above).
   - **Type:** `PostgreSQL`
4. Deploy the backend code using Git, GitHub Actions, or Visual Studio Publish:
   - If using the dotnet CLI, publish the application:
     ```bash
     dotnet publish -c Release -o ./publish
     ```
   - Zip and upload the `./publish` directory contents to Azure App Service.

### Part 3: Deploy Frontend React SPA
1. Run the build script in the frontend directory:
   ```bash
   npm run build
   ```
   This generates static assets in the `frontend/dist` folder.
2. In the Azure Portal, create a **Static Web App** (or **App Service** set to standard static hosting / HTML container).
3. Configure the deployment source (GitHub is easiest and configures CI/CD automatically).
4. Set the build parameters:
   - **App location:** `/frontend`
   - **Api location:** (leave empty)
   - **Output location:** `dist`
5. Once deployed, copy the Static Web App URL (e.g., `https://wonderful-island-xxxx.azurestaticapps.net`).
6. Update the CORS configuration in the Backend Web API:
   - Go to your Backend App Service -> **Configuration** or **CORS** page.
   - Add the React app's Azure Static Web App URL to allowed origins.
