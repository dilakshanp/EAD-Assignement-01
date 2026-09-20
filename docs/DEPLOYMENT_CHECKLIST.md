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
7. Configure MongoDB secrets as IIS environment variables or in the server-only `web.config`:

```xml
<environmentVariables>
  <environmentVariable name="MONGODB_URI" value="mongodb+srv://..." />
  <environmentVariable name="MONGODB_DATABASE" value="smart_solar_microgrid_trading_system" />
</environmentVariables>
```

8. Test these URLs from browser/Postman:

```text
http://SERVER_HOST/api/nodes
http://SERVER_HOST/api/prosumers
http://SERVER_HOST/api/reservations
```

9. Point both clients to the hosted service URL.

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
