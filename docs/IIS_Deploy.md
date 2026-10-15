Yes. For your assignment, deploy **only the ASP.NET Core backend API** to Windows IIS first. The web client and Android app will then point to that hosted API URL.

Follow this simple flow.

**1. On Windows Server / Windows PC**
Install these:

1. Enable IIS:
   - Open **Turn Windows features on or off**
   - Enable:
     - **Internet Information Services**
     - **Web Management Tools**
     - **World Wide Web Services**
     - **Application Development Features**
     - **ASP.NET 4.8** is okay, but for ASP.NET Core the important part is the Hosting Bundle.

2. Install **.NET 8 Hosting Bundle** from Microsoft. This installs the ASP.NET Core Module needed for IIS hosting. Microsoft’s IIS deployment guide says ASP.NET Core apps need the .NET Hosting Bundle on the IIS server. [Microsoft IIS deployment docs](https://learn.microsoft.com/en-us/aspnet/core/tutorials/publish-to-iis), [.NET 8 download page](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

3. Restart IIS after installing:
```powershell
iisreset
```

**2. Publish Backend API On Your Mac**
From your backend folder:

```bash
cd "/Users/jaydee/Downloads/Y4S2/EAD/EAD Assignement-01/backend-api"

dotnet publish -c Release -o ./publish
```

This creates:

```text
backend-api/publish
```

Copy the **contents inside `publish`** to the Windows machine, for example:

```text
C:\inetpub\smart-solar-api
```

**3. Create IIS Website**
On Windows:

1. Open **IIS Manager**
2. Right-click **Sites**
3. Click **Add Website**
4. Set:
   - Site name: `SmartSolarApi`
   - Physical path: `C:\inetpub\smart-solar-api`
   - Port: `5088` or `80`
5. Click OK.

Then create/set the App Pool:

1. Go to **Application Pools**
2. Select `SmartSolarApi`
3. Set:
   - **.NET CLR Version:** `No Managed Code`
   - **Managed pipeline mode:** `Integrated`

Important: ASP.NET Core apps use **No Managed Code** in IIS.

**4. Add Environment Variables On Windows**
Do not put MongoDB secrets in `appsettings.json`.

In Windows, set environment variables using PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("MONGODB_URI", "mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net", "Machine")
[Environment]::SetEnvironmentVariable("MONGODB_DATABASE", "SmartSolarDb", "Machine")
[Environment]::SetEnvironmentVariable("AUTH_SECRET", "your-long-secret-key-at-least-32-characters", "Machine")
```

`MONGODB_URI`, `MONGODB_DATABASE`, and `AUTH_SECRET` are required before the
IIS application starts. The API seeds its demo data during startup, so an
unreachable MongoDB instance can cause IIS to return **HTTP 500.30** before
any controller or CORS middleware runs. After setting the variables, restart
IIS:

```powershell
iisreset
```

**5. Test API In Browser**
Open:

```text
http://localhost:5088/swagger
```

or if using another machine:

```text
http://WINDOWS-IP:5088/swagger
```

If Swagger opens, IIS deployment is working.

**6. Update Web Client API URL**
In `web-client`, set:

```env
VITE_API_URL=http://WINDOWS-IP:5088/api
```

Then rebuild:

```bash
npm run build
```

For demo, you can still run web locally with:

```bash
npm run dev
```

The `VITE_API_URL` value is the API URL. The current backend configuration
allows requests from any origin, so the React client's URL does not need to be
added to a `Cors:Origins` list.

If you later want to restrict browser access, replace `AllowAnyOrigin()` in
`backend-api/Program.cs` with an explicit allowlist and update
`C:\inetpub\smart-solar-api\appsettings.json`:

```json
"Cors": {
  "Origins": [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://WINDOWS-IP:5173"
  ]
}
```

Restart the IIS site after changing this file. If the deployed API is not
using the expected settings, set the same values as IIS environment variables
(`Cors__Origins__0`, `Cors__Origins__1`, and so on) and restart the application
pool.

To verify the preflight request from PowerShell, replace the host if needed:

```powershell
curl.exe -i -X OPTIONS "http://localhost:5088/api/auth/login" `
  -H "Origin: http://localhost:5173" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

The response must include:

```text
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: ...
```

If those headers are absent, confirm that the IIS site's physical path is
`C:\inetpub\smart-solar-api`, that the copied folder contains the current
`SmartSolar.Api.dll` and `appsettings.json`, and that the application pool is
set to **No Managed Code**. A response containing **500.30** means the API
process failed to start; check the MongoDB environment variables, the .NET 8
Hosting Bundle, and the Windows Event Viewer. For temporary diagnostics,
change `stdoutLogEnabled="false"` to `"true"` in the deployed `web.config`,
create `C:\inetpub\smart-solar-api\logs`, reproduce the request, and inspect
the generated `logs\stdout_*.log`. Disable stdout logging again after
diagnosis. The browser's `unload` permissions-policy warning comes from an
inspector extension and is unrelated to this CORS failure.

**7. Update Android API URL**
In Android `strings.xml`, change API base to:

```xml
<string name="api_base">http://WINDOWS-IP:5088/api</string>
```

Then rebuild APK:

```bash
./gradlew assembleDebug
```

If testing on a real phone, the phone and Windows IIS machine must be on the same Wi-Fi, and Windows Firewall must allow the API port.

**For Your Report**
Say this:

> The ASP.NET Core Web API was published in Release mode and hosted on Windows IIS using the .NET Hosting Bundle. MongoDB Atlas connection values and authentication secrets were configured through environment variables. Both the React web client and native Android app communicate with the hosted IIS API through REST endpoints.

That is enough for the IIS deployment requirement.

**Update Publish**

```PowerShell
# Run PowerShell as Administrator
iisreset /stop
# (Paste/Copy your new publish files into C:\inetpub\smart-solar-api here)
iisreset /start
```

all steps together

```PowerShell
iisreset /stop; Copy-Item -Path "$env:USERPROFILE\Desktop\publish\*" -Destination "C:\inetpub\smart-solar-api" -Recurse -Force; iisreset /start

iisreset /stop; Copy-Item -Path "C:\Users\HP\Downloads\Temp Dilakshan\EAD-Assignment\EAD-Assignement-01\backend-api\publish\*" -Destination "C:\inetpub\smart-solar-api" -Recurse -Force; iisreset /start
```