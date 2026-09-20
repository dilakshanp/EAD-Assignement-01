package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public class DashboardActivity extends Activity {
    private ApiClient api;
    private LocalDb localDb;
    private String nic;
    private EditText reservationId;
    private EditText nodeId;
    private EditText energy;
    private EditText searchBooking;
    private JSONArray currentRows = new JSONArray();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);
        api = new ApiClient(this);
        localDb = new LocalDb(this);
        nic = getIntent().getStringExtra("nic");

        reservationId = findViewById(R.id.reservationId);
        nodeId = findViewById(R.id.nodeId);
        energy = findViewById(R.id.energy);
        searchBooking = findViewById(R.id.searchBooking);
        Button book = findViewById(R.id.bookButton);
        Button update = findViewById(R.id.updateButton);
        Button cancel = findViewById(R.id.cancelButton);
        Button history = findViewById(R.id.historyButton);
        Button editProfile = findViewById(R.id.editProfileButton);
        Button mapButton = findViewById(R.id.mapButton);
        Button searchButton = findViewById(R.id.searchButton);
        Button pendingButton = findViewById(R.id.pendingButton);
        Button allButton = findViewById(R.id.allButton);

        book.setOnClickListener(v -> saveReservation(null));
        update.setOnClickListener(v -> {
            String id = reservationId.getText().toString().trim();
            if (id.isEmpty()) {
                Toast.makeText(this, "Enter reservation ID to modify.", Toast.LENGTH_LONG).show();
                return;
            }
            saveReservation(id);
        });
        cancel.setOnClickListener(v -> cancelReservation());
        history.setOnClickListener(v -> loadHistory());
        searchButton.setOnClickListener(v -> renderRows(filterRows(searchBooking.getText().toString().trim(), false), false));
        pendingButton.setOnClickListener(v -> renderRows(filterRows("", true), false));
        allButton.setOnClickListener(v -> renderRows(currentRows, false));
        editProfile.setOnClickListener(v -> {
            Intent intent = new Intent(this, RegisterActivity.class);
            intent.putExtra("nic", nic);
            startActivity(intent);
        });
        mapButton.setOnClickListener(v -> startActivity(new Intent(this, MapActivity.class)));
        loadHistory();
    }

    private void saveReservation(String id) {
        new Thread(() -> {
            try {
                String nodeValue = nodeId.getText().toString().trim();
                String energyValue = energy.getText().toString().trim();
                if (nodeValue.isEmpty() || energyValue.isEmpty()) {
                    runOnUiThread(() -> Toast.makeText(this, "Node ID and energy amount are required.", Toast.LENGTH_LONG).show());
                    return;
                }

                Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
                JSONObject body = new JSONObject();
                body.put("prosumerNic", nic);
                body.put("nodeId", nodeValue);
                body.put("slotStartUtc", start.toString());
                body.put("slotEndUtc", start.plus(1, ChronoUnit.HOURS).toString());
                body.put("energyKwh", Double.parseDouble(energyValue));

                JSONObject response = id == null
                        ? api.post("/reservations/mobile", body)
                        : api.put("/reservations/mobile/" + id, body);
                String action = id == null ? "Created" : "Modified";
                runOnUiThread(() -> {
                    Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show();
                    updateActionSummary(action, response);
                });
                loadHistory();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void cancelReservation() {
        String id = reservationId.getText().toString().trim();
        if (id.isEmpty()) {
            Toast.makeText(this, "Enter reservation ID to cancel.", Toast.LENGTH_LONG).show();
            return;
        }

        new Thread(() -> {
            try {
                JSONObject response = api.post("/reservations/mobile/" + id + "/cancel", new JSONObject());
                runOnUiThread(() -> {
                    Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show();
                    updateActionSummary("Cancelled", response);
                });
                loadHistory();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void updateActionSummary(String action, JSONObject response) {
        JSONObject data = response.optJSONObject("data");
        StringBuilder summary = new StringBuilder();
        summary.append(action).append(" | ").append(response.optString("message", "Completed"));
        if (data != null) {
            summary.append("\nReservation ID: ").append(data.optString("id"));
            summary.append("\nNode: ").append(data.optString("nodeId"));
            summary.append("\nEnergy: ").append(data.optDouble("energyKwh")).append(" kWh");
            summary.append("\nSlot: ").append(data.optString("slotStartUtc"));
            summary.append("\nStatus: ").append(data.optString("status"));
            summary.append("\nQR: ").append(data.optString("transactionCode"));
        }
        ((TextView) findViewById(R.id.actionSummary)).setText(summary.toString());
    }

    private void loadHistory() {
        new Thread(() -> {
            try {
                JSONArray rows = new JSONArray(api.get("/reservations/prosumer/" + nic));
                cacheReservations(rows);
                currentRows = rows;
                runOnUiThread(() -> renderRows(rows, false));
            } catch (Exception ex) {
                JSONArray cached = loadCachedReservations();
                currentRows = cached;
                runOnUiThread(() -> {
                    Toast.makeText(this, "Showing cached bookings while offline.", Toast.LENGTH_LONG).show();
                    renderRows(cached, true);
                });
            }
        }).start();
    }

    private JSONArray filterRows(String query, boolean pendingOnly) {
        JSONArray filtered = new JSONArray();
        String needle = query == null ? "" : query.toLowerCase();
        for (int i = 0; i < currentRows.length(); i++) {
            JSONObject item = currentRows.optJSONObject(i);
            if (item == null) continue;
            String status = item.optString("status");
            boolean pending = "Pending".equals(status) || item.optInt("status") == 0;
            if (pendingOnly && !pending) continue;
            String haystack = (item.optString("id") + " " + item.optString("nodeId") + " " + status + " " + item.optString("transactionCode")).toLowerCase();
            if (!needle.isEmpty() && !haystack.contains(needle)) continue;
            filtered.put(item);
        }
        return filtered;
    }

    private void renderRows(JSONArray rows, boolean offline) {
        int approved = 0;
        int pending = 0;
        String qrValue = "";
        StringBuilder text = new StringBuilder();
        for (int i = 0; i < rows.length(); i++) {
            JSONObject item = rows.optJSONObject(i);
            if (item == null) continue;
            String status = item.optString("status");
            if ("Approved".equals(status) || item.optInt("status") == 1) {
                approved++;
                if (qrValue.isEmpty()) qrValue = item.optString("transactionCode");
            }
            if ("Pending".equals(status) || item.optInt("status") == 0) pending++;
            text.append("ID: ").append(item.optString("id")).append("\n")
                    .append("Node: ").append(item.optString("nodeId")).append(" | Energy: ")
                    .append(item.optDouble("energyKwh")).append(" kWh\n")
                    .append(item.optString("slotStartUtc")).append(" | ")
                    .append(status).append(" | QR: ")
                    .append(item.optString("transactionCode")).append("\n\n");
        }
        String mode = offline ? " | Offline cache" : "";
        ((TextView) findViewById(R.id.summary)).setText("Approved: " + approved + " | Pending: " + pending + " | Showing: " + rows.length() + mode);
        ((TextView) findViewById(R.id.history)).setText(text.length() == 0 ? "No matching reservations found." : text.toString());
        ((QrCodeView) findViewById(R.id.qrCodeView)).setValue(qrValue);
        ((TextView) findViewById(R.id.qrText)).setText(qrValue.isEmpty() ? "No approved transaction QR available yet." : qrValue);
    }

    private void cacheReservations(JSONArray rows) throws Exception {
        SQLiteDatabase db = localDb.getWritableDatabase();
        db.delete("cached_reservation", "nic=?", new String[]{nic});
        for (int i = 0; i < rows.length(); i++) {
            JSONObject item = rows.getJSONObject(i);
            ContentValues values = new ContentValues();
            values.put("id", item.optString("id"));
            values.put("nic", nic);
            values.put("node_id", item.optString("nodeId"));
            values.put("status", item.optString("status"));
            values.put("transaction_code", item.optString("transactionCode"));
            values.put("slot_start", item.optString("slotStartUtc"));
            values.put("energy_kwh", item.optDouble("energyKwh"));
            db.insertWithOnConflict("cached_reservation", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        }
    }

    private JSONArray loadCachedReservations() {
        JSONArray rows = new JSONArray();
        SQLiteDatabase db = localDb.getReadableDatabase();
        try (Cursor cursor = db.query("cached_reservation", null, "nic=?", new String[]{nic}, null, null, "slot_start DESC")) {
            while (cursor.moveToNext()) {
                JSONObject item = new JSONObject();
                item.put("id", cursor.getString(cursor.getColumnIndexOrThrow("id")));
                item.put("prosumerNic", nic);
                item.put("nodeId", cursor.getString(cursor.getColumnIndexOrThrow("node_id")));
                item.put("status", cursor.getString(cursor.getColumnIndexOrThrow("status")));
                item.put("transactionCode", cursor.getString(cursor.getColumnIndexOrThrow("transaction_code")));
                item.put("slotStartUtc", cursor.getString(cursor.getColumnIndexOrThrow("slot_start")));
                item.put("energyKwh", cursor.getDouble(cursor.getColumnIndexOrThrow("energy_kwh")));
                rows.put(item);
            }
        } catch (Exception ignored) {
        }
        return rows;
    }
}
