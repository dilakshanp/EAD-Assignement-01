package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;

import org.json.JSONArray;
import org.json.JSONObject;

public class OperatorActivity extends Activity {
    private ApiClient api;
    private EditText qr;
    private TextView result;
    private TextView bookings;
    private EditText nodeId;
    private EditText slots;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiHelper.applyTheme(this);
        setContentView(R.layout.activity_operator);
        api = new ApiClient(this);
        UiHelper.setupHeader(this, null);
        qr = findViewById(R.id.qrCode);
        result = findViewById(R.id.result);
        bookings = findViewById(R.id.bookings);
        nodeId = findViewById(R.id.operatorNodeId);
        slots = findViewById(R.id.operatorSlots);
        Button scan = findViewById(R.id.scanButton);
        Button finalize = findViewById(R.id.finalizeButton);
        Button updateSlots = findViewById(R.id.updateSlotsButton);
        Button loadBookings = findViewById(R.id.loadBookingsButton);

        scan.setOnClickListener(v -> {
            IntentIntegrator integrator = new IntentIntegrator(this);
            integrator.setPrompt("Scan prosumer transaction QR");
            integrator.setBeepEnabled(true);
            integrator.setOrientationLocked(false);
            integrator.initiateScan();
        });

        finalize.setOnClickListener(v -> finalizeTransfer());
        updateSlots.setOnClickListener(v -> updateBatterySlots());
        loadBookings.setOnClickListener(v -> loadBookings());
        loadBookings();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        IntentResult scanResult = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (scanResult != null) {
            if (scanResult.getContents() == null) {
                Toast.makeText(this, "QR scan cancelled.", Toast.LENGTH_SHORT).show();
            } else {
                qr.setText(scanResult.getContents());
                finalizeTransfer();
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    private void updateBatterySlots() {
        String id = nodeId.getText().toString().trim();
        String slotValue = slots.getText().toString().trim();
        if (id.isEmpty() || slotValue.isEmpty()) {
            Toast.makeText(this, "Node ID and slot count are required.", Toast.LENGTH_LONG).show();
            return;
        }
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("batteryStorageSlots", Integer.parseInt(slotValue));
                JSONObject response = api.patch("/nodes/" + id + "/battery-slots", body);
                runOnUiThread(() -> {
                    Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show();
                    result.setText("Slot availability updated\n" + response.optString("message", "Completed") + "\n\nNode: " + id + "\nAvailable slots: " + slotValue);
                });
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void loadBookings() {
        new Thread(() -> {
            try {
                JSONArray rows = new JSONArray(api.get("/reservations"));
                StringBuilder text = new StringBuilder();
                int active = 0;
                for (int i = 0; i < rows.length(); i++) {
                    JSONObject item = rows.getJSONObject(i);
                    String status = item.optString("status");
                    if ("Approved".equals(status) || "Pending".equals(status) || item.optInt("status") <= 1) active++;
                    text.append(item.optString("prosumerNic")).append(" | Node: ").append(item.optString("nodeId")).append("\n")
                            .append(item.optString("slotStartUtc")).append(" | ").append(status).append("\n")
                            .append("QR: ").append(item.optString("transactionCode")).append("\n\n");
                }
                int activeCount = active;
                runOnUiThread(() -> bookings.setText("Active bookings: " + activeCount + " | Total: " + rows.length() + "\n\n" + (text.length() == 0 ? "No bookings found." : text.toString())));
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void finalizeTransfer() {
        String code = qr.getText().toString().trim();
        if (code.isEmpty()) {
            Toast.makeText(this, "Enter or scan a transaction QR code.", Toast.LENGTH_LONG).show();
            return;
        }

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("transactionCode", code);
                JSONObject response = api.post("/reservations/complete-by-qr", body);
                runOnUiThread(() -> result.setText(formatTransferResult(response)));
                loadBookings();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }
    private String formatTransferResult(JSONObject response) {
        JSONObject data = response.optJSONObject("data");
        StringBuilder builder = new StringBuilder();
        builder.append(response.optBoolean("success") ? "Transfer verified" : "Transfer not completed");
        builder.append("\n").append(response.optString("message", "No message returned."));
        if (data != null) {
            builder.append("\n\nProsumer: ").append(data.optString("prosumerNic"));
            builder.append("\nNode: ").append(data.optString("nodeId"));
            builder.append("\nEnergy: ").append(data.optDouble("energyKwh")).append(" kWh");
            builder.append("\nSlot: ").append(compactDate(data.optString("slotStartUtc")));
            builder.append("\nStatus: ").append(statusLabel(data));
        }
        return builder.toString();
    }

    private String statusLabel(JSONObject item) {
        String status = item.optString("status");
        if (status != null && !status.isEmpty() && !status.matches("\\d+")) return status;
        int value = item.optInt("status", -1);
        switch (value) {
            case 0: return "Pending";
            case 1: return "Approved";
            case 2: return "Cancelled";
            case 3: return "Completed";
            default: return status == null || status.isEmpty() ? "Unknown" : status;
        }
    }

    private String compactDate(String value) {
        if (value == null || value.isEmpty()) return "Not scheduled";
        return value.replace("T", " ").replace("Z", " UTC");
    }

}
