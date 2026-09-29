# smart_solar_microgrid_trading_system

SE4040 Enterprise Application Development Assignment 1: Smart Solar Microgrid Trading System.

## Project Structure

- `backend-api` - ASP.NET Core C# Web API using MongoDB.
- `web-client` - React/Vite web application for Backoffice and Grid Operator users.
- `android-app` - Pure native Android Java application with SQLite.
- `docs` - API, deployment, report, and viva preparation notes.

## Default Development Accounts

- Backoffice: `admin` / `admin123`
- Grid Operator: `operator` / `operator123`

## Backend Setup

1. Install the .NET 8 SDK.
2. Create the local backend environment file:

```bash
cd backend-api
cp .env.example .env
```

3. Add your MongoDB Atlas connection string to `backend-api/.env`:

```bash
MONGODB_URI="paste-your-mongodb-atlas-connection-string-here"
MONGODB_DATABASE="smart_solar_microgrid_trading_system"
```

4. Run the API:

```bash
dotnet restore
dotnet run --urls "http://0.0.0.0:5088"
```

API URL: `http://localhost:5088/api`

## Web Client Setup

```bash
cd web-client
npm install
npm run dev
```

Web URL: `http://localhost:5173`

Optional hosted API override:

```bash
VITE_API_URL=http://YOUR_SERVER_HOST/api npm run dev
```

## Android Setup

The Android app reads its API URL from:

```text
android-app/app/src/main/res/values/strings.xml
```

Use one of these values for `api_base`:

- Emulator: `http://10.0.2.2:5088/api`
- Physical phone on same Wi-Fi: `http://YOUR_MAC_IP:5088/api`
- IIS deployment: `http://YOUR_SERVER_HOST/api`

Create ignored local Android properties:

```properties
sdk.dir=/Users/YOUR_USER/Library/Android/sdk
MAPS_API_KEY=your_restricted_google_maps_key_here
```

Build the Android APK:

```bash
cd android-app
./gradlew assembleDebug
```

## Final Submission Notes

- Backend C# source files include file header blocks and method-level comments.
- Do not commit real `.env`, `local.properties`, APKs, build folders, or unrestricted API keys.
- Capture unique screenshots of all web and Android screens for the report.
- Use this GitHub repository name: `smart_solar_microgrid_trading_system`.

## AI Disclosure

This project was developed with AI assistance under the updated Level 4 AI policy. The final submitter must review, test, understand, and be able to explain or modify every part during the viva.

## Demo Video and Repository

Add the final demo video link and GitHub repository link in the report before submission.
