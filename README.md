# smart_solar_microgrid_trading_system

SE4040 Enterprise Application Development Assignment 1: Smart Solar Microgrid Trading System.

## Project Structure

- `backend-api` - ASP.NET Core C# Web API using MongoDB.
- `web-client` - React/Vite web application for Backoffice and Grid Operator users.
- `android-app` - Pure native Android Java application with SQLite.
- `docs` - report template, diagrams, and setup notes.

## Default Accounts

- Backoffice: `admin` / `admin123`
- Grid Operator: `operator` / `operator123`

## Backend Setup

1. Install .NET 8 SDK.
2. Configure MongoDB.
3. Run:

```bash
cd backend-api
dotnet restore
dotnet run
```

API URL: `http://localhost:5088/api`

### MongoDB Configuration

The committed [backend-api/appsettings.json](backend-api/appsettings.json) is safe to push because it only contains the local default connection string. Do not put your MongoDB Atlas username or password in this committed file.

If a MongoDB password is ever pasted into chat, committed to Git, or shared publicly, rotate it immediately in MongoDB Atlas under **Database Access** before using it again.

For local development, create this ignored file:

```bash
cp backend-api/appsettings.Development.json.example backend-api/appsettings.Development.json
```

Then edit `backend-api/appsettings.Development.json` and place your real Atlas connection string there.

You can also use an environment variable instead:

```bash
export MongoDb__ConnectionString='mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority'
dotnet run
```

ASP.NET Core maps `MongoDb__ConnectionString` to `MongoDb:ConnectionString`.

### MongoDB Atlas With Environment Variables

For the Atlas credentials, the backend does not need separate `MONGODB_USERNAME`, `MONGODB_PASSWORD`, and `MONGODB_URI` variables. It expects the ASP.NET Core configuration keys below:

```bash
export MongoDb__ConnectionString='mongodb+srv://YOUR_ATLAS_USERNAME:YOUR_ATLAS_PASSWORD@cluster0.3gnr2ni.mongodb.net/?retryWrites=true&w=majority'
export MongoDb__DatabaseName='smart_solar_microgrid_trading_system'
```

Then run the API in the same terminal:

```bash
cd backend-api
dotnet run
```

Example username format:

```text
YOUR_ATLAS_USERNAME=it22297372_db_user
```

Do not add backslashes before `_` or `@` in the connection string. If the password contains special characters such as `@`, `#`, `/`, `:`, or `%`, URL-encode the password before placing it in the URI.

For Windows PowerShell:

```powershell
$env:MongoDb__ConnectionString="mongodb+srv://YOUR_ATLAS_USERNAME:YOUR_ATLAS_PASSWORD@cluster0.3gnr2ni.mongodb.net/?retryWrites=true&w=majority"
$env:MongoDb__DatabaseName="smart_solar_microgrid_trading_system"
dotnet run
```

## Web Client Setup

```bash
cd web-client
npm install
npm run dev
```

## Android Setup

Open `android-app` in Android Studio. The emulator uses `http://10.0.2.2:5088/api` to reach the backend on the host machine.

## AI Disclosure

This project was generated with AI assistance under the updated Level 4 AI policy. The final submitter must review, test, understand, and be able to explain or modify every part during the viva.

## Video Link

Add your YouTube or OneDrive demo video link here.

## Git Repository

Use this repository name on GitHub: `smart_solar_microgrid_trading_system`.

Add your GitHub repository link here and include each member contribution.
