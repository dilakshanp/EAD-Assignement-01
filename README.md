# Smart Solar Microgrid Trading System

SE4040 Enterprise Application Development Assignment 1.

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
2. Start MongoDB locally on `mongodb://localhost:27017`.
3. Run:

```bash
cd backend-api
dotnet restore
dotnet run
```

API URL: `http://localhost:5088/api`

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

Add your GitHub repository link here and include each member contribution.
