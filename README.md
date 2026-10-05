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

## Team Contributions

| Member                         | Main Responsibilities                                                                                                                                                                                              | Report Sections                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| IT22102928 Denislas Coonghe J. | Backend authentication and user management: ASP.NET Core API setup, MongoDB connection, user roles, login, bearer authentication, prosumer registration API, profile updates, activation, and deactivation.        | Introduction, authentication design, user/prosumer management.    |
| IT22115966 Bavithran S.        | Backend trading and node management: microgrid node APIs, GPS/capacity/battery schedules, node deactivation rules, reservation APIs, approval workflow, QR transaction completion.                                 | Business rules, reservation workflow, API endpoint documentation. |
| IT22273444 Koshigawarman Y.    | Web application: React/Tailwind interface, Backoffice dashboard, user management, prosumer management, node management, reservation management, approval and QR finalization interface.                            | Web UI screenshots, web architecture, responsive design.          |
| IT22297372 Dilakshan P.        | Native Android application: pure Android Java app, SQLite database, prosumer registration/profile UI, reservations, history/search, Google Maps, QR generation, operator login, QR scanning, battery-slot updates. | Android screenshots, SQLite design, Maps and QR functionality.    |

### Individual Contributions

IT22102928 Denislas Coonghe J. developed the ASP.NET Core Web API authentication and user-management features. This included MongoDB integration, role-based access, bearer-token authentication, prosumer registration API support, profile management, and account status control.

IT22115966 Bavithran S. developed the backend microgrid-node and energy-trading features. This included node GPS and capacity management, battery schedules, node deactivation rules, reservation validation, approval workflow, QR transaction generation, and energy-transfer completion.

IT22273444 Koshigawarman Y. developed the React and Tailwind web application. This included the Backoffice and Grid Operator interfaces, user management, prosumer management, microgrid-node management, reservation management, approval controls, and QR transfer controls.

IT22297372 Dilakshan P. developed the pure native Android application. This included SQLite local persistence, prosumer registration and profile editing screens, reservation creation and management, booking history and search, Google Maps node display, QR generation, Grid Operator mode, QR scanning, and battery-slot updates.

## Git Repository

Repository link: `ADD_GITHUB_REPOSITORY_LINK_HERE`

## Demo Video

Video link: `ADD_YOUTUBE_OR_ONEDRIVE_VIDEO_LINK_HERE`

The demo video should be no more than 5 minutes and should explain how the application works.
