**Web Client Test Checklist**

Run backend first:

```bash
cd "/Users/jaydee/Downloads/Y4S2/EAD/EAD Assignement-01/backend-api"
dotnet run
```

Run web client:

```bash
cd "/Users/jaydee/Downloads/Y4S2/EAD/EAD Assignement-01/web-client"
npm run dev
```

Open:

```text
http://localhost:5173
```

**1. Login**

Test Backoffice login:

```text
Username: backoffice
Password: admin123
```

Expected:

- Dashboard opens.
- Sidebar shows Dashboard, Users, Prosumers, Grid Nodes, Reservations.
- Role label shows Backoffice.

Test Grid Operator login:

```text
Username: operator
Password: operator123
```

Expected:

- Dashboard opens.
- Sidebar shows operational pages only.
- Users page should not appear.
- Prosumers admin page should not appear.

**2. User Management**

Login as Backoffice.

Go to **Users**.

Test:

- Create user with role `Backoffice`.
- Create user with role `GridOperator`.
- Confirm new users appear in the table.

Expected:

- Backoffice can create users.
- Grid Operator should not have access to this page.

**3. Prosumer Management**

Login as Backoffice.

Go to **Prosumers**.

Test create:

- Enter NIC.
- Enter full name.
- Enter phone.
- Enter email.
- Enter address.
- Enter solar capacity.
- Click **Save Prosumer**.

Expected:

- Success message appears.
- Prosumer appears in table.
- NIC is used as the main identifier.

Test update:

- Click **Edit** on a prosumer.
- Change phone/email/address/capacity.
- Click **Save Prosumer**.

Expected:

- Existing prosumer updates.

Test deactivate:

- Click **Deactivate**.

Expected:

- Status changes to `Deactivated`.

Test reactivate:

- Click **Activate**.

Expected:

- Status changes back to `Active`.

**4. Microgrid Node Management**

Login as Backoffice or Grid Operator.

Go to **Grid Nodes**.

Test create node:

- Enter node name.
- Enter location name.
- Enter latitude.
- Enter longitude.
- Enter capacity kWh.
- Enter battery storage slots.
- Add at least one schedule:
  - Schedule start
  - Schedule end
  - Available slots
- Click **Add Schedule**.
- Click **Save Node**.

Expected:

- Node is created.
- Node appears in table.
- Schedule count appears.

Test update node:

- Click **Edit**.
- Change capacity or battery slots.
- Add/remove schedule.
- Click **Save Node**.

Expected:

- Node updates correctly.

Test deactivate node without reservations:

- Click **Deactivate**.

Expected:

- Node becomes inactive or success message appears.

**5. Node Deactivation Block Rule**

Create a new active node.

Create a reservation for that node.

Go back to **Grid Nodes**.

Click **Deactivate** on that node.

Expected:

- Deactivation should be blocked.
- Message should say node cannot be deactivated while active reservations exist.

**6. Energy Reservation Management**

Login as Backoffice or Grid Operator.

Go to **Reservations**.

Test create reservation:

- Enter Prosumer NIC.
- Enter active Node ID.
- Select slot start date/time within the next 7 days.
- Select slot end date/time.
- Enter energy kWh.
- Click **Save Reservation**.

Expected:

- Reservation is created.
- Reservation appears in table.
- Status should be approved/pending depending on display.
- Transaction code appears if shown.

**7. Reservation 7-Day Rule**

Go to **Reservations**.

Try creating a reservation with a date more than 7 days from now.

Expected:

- Reservation should not be created.
- Error message should say reservations must be scheduled within 7 days.

**8. Reservation Past-Date Rule**

Try creating a reservation with a past date/time.

Expected:

- Reservation should not be created.
- Error message should say reservation slot must be in the future.

**9. Reservation Update**

Create a reservation scheduled more than 12 hours from now.

Click **Edit**.

Change:

- Slot time
- Energy amount
- Node if needed

Click **Update Reservation**.

Expected:

- Reservation updates successfully.

**10. Reservation 12-Hour Update Rule**

Create or use a reservation scheduled within the next 12 hours.

Click **Edit**.

Try to update it.

Expected:

- Update should be blocked.
- Message should say updates require at least 12 hours notice.

**11. Reservation Cancel**

Create a reservation scheduled more than 12 hours from now.

Click **Cancel**.

Expected:

- Reservation status changes to `Cancelled`.

**12. Reservation 12-Hour Cancel Rule**

Create or use a reservation scheduled within the next 12 hours.

Click **Cancel**.

Expected:

- Cancel should be blocked.
- Message should say cancellations require at least 12 hours notice.

**13. Dashboard**

Go to **Dashboard**.

Expected:

- Reservation counts load.
- Node counts load.
- Recent reservations table loads.
- No blank or crashing sections.

**14. Navigation**

Click between all sidebar tabs:

- Dashboard
- Users
- Prosumers
- Grid Nodes
- Reservations

Expected:

- No React error.
- No blank screen.
- Data remains visible.
- Forms still work after switching tabs.

**15. Logout**

Click **Logout**.

Expected:

- You return to login screen.
- Logging in again works normally.
