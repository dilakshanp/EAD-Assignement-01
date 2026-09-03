package com.sliit.solarmicrogrid;

import android.app.Activity;
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
    private String nic;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);
        api = new ApiClient(this);
        nic = getIntent().getStringExtra("nic");

        EditText nodeId = findViewById(R.id.nodeId);
        EditText energy = findViewById(R.id.energy);
        Button book = findViewById(R.id.bookButton);
        Button history = findViewById(R.id.historyButton);

        book.setOnClickListener(v -> new Thread(() -> {
            try {
                Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
                JSONObject body = new JSONObject();
                body.put("prosumerNic", nic);
                body.put("nodeId", nodeId.getText().toString());
                body.put("slotStartUtc", start.toString());
                body.put("slotEndUtc", start.plus(1, ChronoUnit.HOURS).toString());
                body.put("energyKwh", Double.parseDouble(energy.getText().toString()));
                JSONObject response = api.post("/reservations", body);
                runOnUiThread(() -> Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show());
                loadHistory();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start());

        history.setOnClickListener(v -> loadHistory());
        loadHistory();
    }

    private void loadHistory() {
        new Thread(() -> {
            try {
                JSONArray rows = new JSONArray(api.get("/reservations/prosumer/" + nic));
                int approved = 0;
                StringBuilder text = new StringBuilder();
                for (int i = 0; i < rows.length(); i++) {
                    JSONObject item = rows.getJSONObject(i);
                    if ("Approved".equals(item.optString("status")) || item.optInt("status") == 1) approved++;
                    text.append(item.optString("slotStartUtc")).append(" | ")
                            .append(item.optString("status")).append(" | QR: ")
                            .append(item.optString("transactionCode")).append("\n\n");
                }
                int totalApproved = approved;
                runOnUiThread(() -> {
                    ((TextView) findViewById(R.id.summary)).setText("Approved future reservations: " + totalApproved + " | Total bookings: " + rows.length());
                    ((TextView) findViewById(R.id.history)).setText(text.toString());
                });
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }
}
