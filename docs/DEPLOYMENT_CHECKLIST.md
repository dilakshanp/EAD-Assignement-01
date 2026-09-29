# Deployment Checklist

## Windows IIS Web API Hosting

1. Install the .NET 8 Hosting Bundle on the Windows IIS machine.
2. Enable IIS and ASP.NET Core hosting support.
3. Publish the API from the backend project:

```bash
cd backend-api
dotnet publish -c Release -o ./publish
```

4. Copy `backend-api/publish` to the IIS server, for example `C:\inetpub\smart_solar_api`.
5. Create an IIS site or application pointing to that folder.
6. Set the Application Pool to `No Managed Code`.
7. Configure production environment variables on IIS. Do not store real secrets in Git.

```xml
<environmentVariables>
  <environmentVariable name="MONGODB_URI" value="mongodb+srv://..." />
  <environmentVariable name="MONGODB_DATABASE" value="smart_solar_microgrid_trading_system" />
  <environmentVariable name="Auth__Secret" value="replace-with-a-long-production-secret" />
</environmentVariables>
```

8. Test the hosted API from browser/Postman:

```text
http://SERVER_HOST/api/nodes
http://SERVER_HOST/api/prosumers
http://SERVER_HOST/api/reservations
```

Protected endpoints require login and the bearer token.

9. Point both clients to the hosted service URL:

- Web client API base: set `VITE_API_URL=http://SERVER_HOST/api` when building/running the web client.
- Android API base: update `android-app/app/src/main/res/values/strings.xml`.

## MongoDB Atlas Checklist

- Use a dedicated database user with only the required permissions.
- Restrict network access where possible.
- Rotate any secret that was previously exposed in GitHub secret scanning.
- Keep real credentials only in ignored local files or server environment variables.

## Google Maps API Key Restriction

1. Open Google Cloud Console > APIs & Services > Credentials.
2. Select the Maps API key used for the Android app.
3. Application restriction: `Android apps`.
4. Add package name:

```text
com.sliit.solarmicrogrid
```

5. Add debug SHA-1 fingerprint:

```bash
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android
```

6. API restriction: allow only `Maps SDK for Android`.
7. Keep the real key only in ignored `android-app/local.properties`:

```properties
MAPS_API_KEY=your_restricted_key_here
```

Never commit unrestricted API keys.

## Final Build Checks

```bash
cd backend-api && dotnet build
cd ../web-client && npm run build
cd ../android-app && ./gradlew assembleDebug
```
