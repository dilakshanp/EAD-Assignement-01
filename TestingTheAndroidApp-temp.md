1. Every time you want to test the Android app, do this checklist.

**1. Start Emulator**

```bash
emulator -avd Medium_Phone_API_35
```

Leave that terminal open.

**2. Confirm Device**

In a new terminal:

```bash
adb devices
```

Expected:

```text
emulator-5554    device
```

**3. Start Backend API**

In another terminal:

```bash
cd "/Users/jaydee/Downloads/Y4S2/EAD/EAD Assignement-01/backend-api"
dotnet run --urls "http://0.0.0.0:5088"
```

Leave it running.

**4. Build Android APK**

```bash
cd "/Users/jaydee/Downloads/Y4S2/EAD/EAD Assignement-01/android-app"
./gradlew assembleDebug
```

**5. Install APK**

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**6. Open App**

```bash
adb shell monkey -p com.sliit.solarmicrogrid 1
```

**Important**

If `adb` or `emulator` says command not found, run this first:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Better permanent fix:

```bash
echo 'export ANDROID_HOME="$HOME/Library/Android/sdk"' >> ~/.zshrc
echo 'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Then future terminals should work normally.

2. Prosumer Registration
   Open app.
   Tap:
   Create Prosumer Account
   Enter:

- NIC
- Full name
- Phone
- Email
- Address
- Solar capacity
- Password
- Confirm password
  Tap:
  Save Profile
  Expected:
- Profile is registered.
- Message says to login with NIC and password.
- App returns to login screen.

3. Prosumer Login
   Login using:
   Username: your NIC
   Password: password you created
   Expected:

- App opens Prosumer Dashboard.
- Dashboard shows approved/pending/booking count.
- No crash.

4. Edit Prosumer Profile
   From dashboard tap:
   Edit Prosumer Profile
   Change some profile data.
   Tap:
   Save Profile
   Expected:

- Profile updates through API.
- Local SQLite profile data is updated.
- App returns to login/dashboard flow safely.

5. Request Account Deactivation
   Open profile screen.
   Enter NIC.
   Tap:
   Request Deactivation
   Expected:

- Message says deactivation request submitted.
- In web app, Backoffice should see that prosumer as pending/deactivation status.

6. Create Reservation
   Login as prosumer.
   On dashboard enter:

- Node ID
- Energy amount kWh
  Tap:
  Create Booking Request
  Expected:
- Reservation is created.
- Summary panel updates.
- Booking appears in history.
- Approved/pending count updates.
- QR transaction code appears if approved.

7. Modify Reservation
   Copy reservation ID from booking history.
   Paste into:
   Reservation ID for update/cancel
   Change:

- Node ID
- Energy amount
  Tap:
  Modify Reservation
  Expected:
- Reservation updates.
- Summary panel shows modified reservation details.
- Booking history refreshes.

8. Cancel Reservation
   Enter reservation ID.
   Tap:
   Cancel Reservation
   Expected:

- Reservation status changes to cancelled.
- Summary panel shows cancellation result.
- Booking history refreshes.

9. 12-Hour Rule
   Try modifying or cancelling a booking whose slot is within 12 hours.
   Expected:

- API rejects the action.
- Message says updates/cancellations require at least 12 hours notice.

10. QR Dispatch
    After creating an approved reservation, check dashboard.
    Expected:

- QR-style transaction panel appears.
- Transaction code text appears below QR.
- Same transaction code appears in booking history.

11. Booking History
    Tap:
    Refresh Booking History
    Expected:

- All bookings for the logged-in prosumer appear.
- Each row includes:
  - Reservation ID
  - Node ID
  - Energy kWh
  - Slot time
  - Status
  - QR transaction code

12. Pending Booking Filter
    Tap:
    Show Pending Bookings
    Expected:

- Only pending bookings are shown.
- If none exist, app shows no matching reservations.

13. Search Booking
    Use search box.
    Search by:

- Reservation ID
- Node ID
- Status
- QR transaction code
  Tap:
  Search Bookings
  Expected:
- Matching bookings only are displayed.
  Tap:
  Show All Bookings
  Expected:
- Full booking list returns.

14. SQLite Offline Cache
    First, while backend is running:

- Login
- Refresh booking history
  Then stop backend.
  Tap:
  Refresh Booking History
  Expected:
- App shows cached bookings from SQLite.
- Summary shows offline cache.
- App does not crash.

15. Google Maps / Nearby Nodes
    Tap:
    View Nearby Grid Nodes Map
    Expected:

- Google Map opens.
- Active grid nodes appear as markers.
- Marker shows station/location/capacity/slot details.
  If map is blank:
- Check Maps API key.
- Check key restriction.
- Check nodes have latitude/longitude.

16. Grid Operator Login
    Go back to login.
    Login with:
    Username: operator
    Password: operator123
    Expected:

- App opens Grid Operator Console.
- Prosumer dashboard should not open for operator.

17. Operator Booking Monitor
    In Operator Console tap:
    Load Power Trading Bookings
    Expected:

- Operator sees bookings from API.
- Active/total booking count appears.
- Booking details show prosumer, node, slot, status, QR code.

18. Operator Battery Slot Update
    In Operator Console enter:

- Node ID
- Available battery slots
  Tap:
  Update Battery Slots
  Expected:
- API updates node battery slot availability.
- Success message appears.
- Web Grid Nodes page shows updated slot count.

19. Operator QR Scan
    In Operator Console tap:
    Scan QR With Camera
    Scan the prosumer transaction QR/code.
    Expected:

- QR code is read.
- Transaction code fills automatically.
- App verifies against server.
- Energy transfer is finalized.
- Booking status changes to completed.
  If camera does not work in emulator, paste QR transaction code manually and tap:
  Verify and Finalize Transfer

20. Final Pass
    Confirm:

- Prosumer can register, login, edit profile, request deactivation.
- Prosumer can create, modify, cancel booking.
- Dashboard shows counts, history, pending filter, search.
- QR transaction is generated/displayed.
- Operator can login, monitor bookings, update slots, scan/finalize QR.
- Map shows nearby grid nodes.
- SQLite cache works when backend is offline.
