package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.res.ColorStateList;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.zxing.BarcodeFormat;
import com.journeyapps.barcodescanner.BarcodeEncoder;

import androidx.core.content.res.ResourcesCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;

public class DashboardActivity extends Activity {
    private ApiClient api;
    private LocalDb localDb;
    private String nic;
    private EditText nodeId;
    private EditText energy;
    private EditText manageNodeId;
    private EditText manageEnergy;
    private EditText searchBooking;
    private Spinner nodeSelector;
    private Spinner manageNodeSelector;
    private Spinner bookingSelector;
    private LinearLayout historyList;
    private TextView selectedBookingPreview;
    private TextView bookingEstimate;
    private JSONArray currentRows = new JSONArray();
    private final ArrayList<String> bookingIds = new ArrayList<>();
    private final ArrayList<String> bookingLabels = new ArrayList<>();
    private final ArrayList<JSONObject> bookingItems = new ArrayList<>();
    private final ArrayList<String> nodeIds = new ArrayList<>();
    private final ArrayList<String> nodeLabels = new ArrayList<>();
    private final HashMap<String, String> nodeNames = new HashMap<>();
    private Typeface sourceSansRegular;
    private Typeface sourceSansBold;
    private boolean syncingBottomNav = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiHelper.applyTheme(this);
        setContentView(R.layout.activity_dashboard);
        sourceSansRegular = ResourcesCompat.getFont(this, R.font.source_sans_pro_regular);
        sourceSansBold = ResourcesCompat.getFont(this, R.font.source_sans_pro_bold);
        api = new ApiClient(this);
        localDb = new LocalDb(this);
        nic = getIntent().getStringExtra("nic");
        UiHelper.setupHeader(this, nic);

        nodeId = findViewById(R.id.nodeId);
        energy = findViewById(R.id.energy);
        manageNodeId = findViewById(R.id.manageNodeId);
        manageEnergy = findViewById(R.id.manageEnergy);
        searchBooking = findViewById(R.id.searchBooking);
        nodeSelector = findViewById(R.id.nodeSelector);
        manageNodeSelector = findViewById(R.id.manageNodeSelector);
        bookingSelector = findViewById(R.id.bookingSelector);
        historyList = findViewById(R.id.historyList);
        selectedBookingPreview = findViewById(R.id.selectedBookingPreview);
        bookingEstimate = findViewById(R.id.bookingEstimate);

        nodeSelector.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position >= 0 && position < nodeIds.size()) nodeId.setText(nodeIds.get(position));
            }

            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        manageNodeSelector.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position >= 0 && position < nodeIds.size()) manageNodeId.setText(nodeIds.get(position));
            }

            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        bookingSelector.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                populateManageFields(position);
            }

            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        findViewById(R.id.newTab).setOnClickListener(v -> showSection("home"));
        findViewById(R.id.quickBookButton).setOnClickListener(v -> showSection("trade"));
        findViewById(R.id.manageTab).setOnClickListener(v -> showSection("trade"));
        findViewById(R.id.historyTab).setOnClickListener(v -> showSection("trade"));
        findViewById(R.id.toolsTab).setOnClickListener(v -> showSection("tools"));
        BottomNavigationView bottomNav = findViewById(R.id.bottomNav);
        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            syncingBottomNav = true;
            if (itemId == R.id.nav_home) {
                showSection("home");
                syncingBottomNav = false;
                return true;
            }
            if (itemId == R.id.nav_trade) {
                showSection("trade");
                syncingBottomNav = false;
                return true;
            }
            syncingBottomNav = false;
            return false;
        });
        findViewById(R.id.bookButton).setOnClickListener(v -> saveReservation(null));
        findViewById(R.id.updateButton).setOnClickListener(v -> saveReservation(getSelectedBookingId()));
        findViewById(R.id.cancelButton).setOnClickListener(v -> cancelReservation());
        findViewById(R.id.searchButton).setOnClickListener(v -> renderRows(filterRows(searchBooking.getText().toString().trim(), "active"), false));
        findViewById(R.id.pendingButton).setOnClickListener(v -> renderRows(filterRows(searchBooking.getText().toString().trim(), "pending"), false));
        findViewById(R.id.allButton).setOnClickListener(v -> renderRows(filterRows(searchBooking.getText().toString().trim(), "all"), false));
        findViewById(R.id.historyButton).setOnClickListener(v -> renderRows(filterRows(searchBooking.getText().toString().trim(), "cancelled"), false));
        findViewById(R.id.editProfileButton).setOnClickListener(v -> {
            Intent intent = new Intent(this, AccountSettingsActivity.class);
            intent.putExtra("nic", nic);
            startActivity(intent);
        });
        findViewById(R.id.mapButton).setOnClickListener(v -> startActivity(new Intent(this, MapActivity.class)));

        showSection("home");
        loadNodes();
        loadHistory();
    }

    private void showSection(String section) {
        updateTabState(section);
        findViewById(R.id.homeSection).setVisibility("home".equals(section) ? View.VISIBLE : View.GONE);
        findViewById(R.id.newSection).setVisibility("trade".equals(section) ? View.VISIBLE : View.GONE);
        findViewById(R.id.historySection).setVisibility("trade".equals(section) ? View.VISIBLE : View.GONE);
        findViewById(R.id.manageSection).setVisibility(View.GONE);
        findViewById(R.id.summarySection).setVisibility(View.GONE);
        findViewById(R.id.toolsSection).setVisibility("tools".equals(section) ? View.VISIBLE : View.GONE);
    }

    private void updateTabState(String selected) {
        setTabState(R.id.newTab, "home".equals(selected));
        setTabState(R.id.manageTab, "trade".equals(selected));
        setTabState(R.id.historyTab, false);
        setTabState(R.id.toolsTab, "tools".equals(selected));
        BottomNavigationView bottomNav = findViewById(R.id.bottomNav);
        if (bottomNav != null && !syncingBottomNav) {
            int target = "home".equals(selected) ? R.id.nav_home : R.id.nav_trade;
            if (bottomNav.getSelectedItemId() != target) bottomNav.setSelectedItemId(target);
        }
    }

    private void setTabState(int buttonId, boolean selected) {
        Button button = findViewById(buttonId);
        button.setBackgroundResource(selected ? R.drawable.tab_selected : R.drawable.tab_unselected);
        button.setTextColor(selected ? Color.WHITE : Color.rgb(0, 83, 63));
    }

    private void loadNodes() {
        new Thread(() -> {
            try {
                JSONArray rows = new JSONArray(api.get("/nodes"));
                runOnUiThread(() -> renderNodes(rows));
            } catch (Exception ex) {
                runOnUiThread(() -> {
                    nodeId.setVisibility(View.VISIBLE);
                    manageNodeId.setVisibility(View.VISIBLE);
                    Toast.makeText(this, "Could not load nodes. You can type the node ID manually.", Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private void renderNodes(JSONArray rows) {
        nodeIds.clear();
        nodeLabels.clear();
        nodeNames.clear();
        for (int i = 0; i < rows.length(); i++) {
            JSONObject node = rows.optJSONObject(i);
            if (node == null || !node.optBoolean("isActive", true)) continue;
            String id = node.optString("id");
            if (id.isEmpty()) continue;
            String name = node.optString("name", "Grid node");
            String location = node.optString("locationName", "");
            int slots = node.optInt("batteryStorageSlots", 0);
            double capacity = node.optDouble("capacityKwh", 0);
            nodeIds.add(id);
            nodeNames.put(id, name);
            String place = location.isEmpty() ? "Location not set" : location;
            nodeLabels.add(name + " - " + place + "  |  " + slots + " slots");
        }
        if (nodeLabels.isEmpty()) nodeLabels.add("No active nodes available");
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, nodeLabels);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        nodeSelector.setAdapter(adapter);
        manageNodeSelector.setAdapter(adapter);
        if (!nodeIds.isEmpty()) {
            nodeId.setText(nodeIds.get(0));
            manageNodeId.setText(nodeIds.get(0));
        }
        if (currentRows.length() > 0) renderRows(currentRows, false);
    }

    private void populateManageFields(int index) {
        if (index < 0 || index >= bookingItems.size()) return;
        JSONObject item = bookingItems.get(index);
        String selectedNodeId = item.optString("nodeId");
        manageNodeId.setText(selectedNodeId);
        selectNodeInSpinner(manageNodeSelector, selectedNodeId);
        double amount = item.optDouble("energyKwh", 0);
        manageEnergy.setText(amount == 0 ? "" : String.valueOf(amount));
        selectedBookingPreview.setText(bookingSummary(item));
    }

    private void selectNodeInSpinner(Spinner spinner, String id) {
        for (int i = 0; i < nodeIds.size(); i++) {
            if (nodeIds.get(i).equals(id)) {
                spinner.setSelection(i);
                return;
            }
        }
    }

    private String getSelectedBookingId() {
        int index = bookingSelector.getSelectedItemPosition();
        if (index < 0 || index >= bookingIds.size()) {
            Toast.makeText(this, "Select a booking first.", Toast.LENGTH_LONG).show();
            return "";
        }
        return bookingIds.get(index);
    }

    private void saveReservation(String id) {
        if (id != null && id.isEmpty()) return;
        new Thread(() -> {
            try {
                EditText selectedNode = id == null ? nodeId : manageNodeId;
                EditText selectedEnergy = id == null ? energy : manageEnergy;
                String nodeValue = selectedNode.getText().toString().trim();
                String energyValue = selectedEnergy.getText().toString().trim();
                if (nodeValue.isEmpty() || energyValue.isEmpty()) {
                    runOnUiThread(() -> Toast.makeText(this, "Select a node and enter an energy amount.", Toast.LENGTH_LONG).show());
                    return;
                }

                Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
                JSONObject body = new JSONObject();
                body.put("prosumerNic", nic);
                body.put("nodeId", nodeValue);
                body.put("slotStartUtc", start.toString());
                body.put("slotEndUtc", start.plus(1, ChronoUnit.HOURS).toString());
                body.put("energyKwh", Double.parseDouble(energyValue));

                JSONObject response = id == null ? api.post("/reservations/mobile", body) : api.put("/reservations/mobile/" + id, body);
                String action = id == null ? "Booking created" : "Booking updated";
                runOnUiThread(() -> updateActionSummary(action, response));
                loadHistory();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void cancelReservation() {
        String id = getSelectedBookingId();
        if (id.isEmpty()) return;
        new Thread(() -> {
            try {
                JSONObject response = api.post("/reservations/mobile/" + id + "/cancel", new JSONObject());
                runOnUiThread(() -> updateActionSummary("Booking cancelled", response));
                loadHistory();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void cancelReservation(String id) {
        if (id == null || id.isEmpty()) return;
        new Thread(() -> {
            try {
                JSONObject response = api.post("/reservations/mobile/" + id + "/cancel", new JSONObject());
                runOnUiThread(() -> updateActionSummary("Booking cancelled", response));
                loadHistory();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }


    private void openEditBookingDialog(JSONObject item) {
        String reservationId = item.optString("id");
        if (reservationId == null || reservationId.isEmpty()) {
            Toast.makeText(this, "Booking ID is missing.", Toast.LENGTH_LONG).show();
            return;
        }

        ArrayList<String> pickerIds = new ArrayList<>();
        ArrayList<String> pickerLabels = new ArrayList<>();
        for (int i = 0; i < nodeIds.size(); i++) {
            pickerIds.add(nodeIds.get(i));
            pickerLabels.add(i < nodeLabels.size() ? nodeLabels.get(i) : displayNode(nodeIds.get(i)));
        }

        String currentNodeId = item.optString("nodeId");
        if (!currentNodeId.isEmpty() && !pickerIds.contains(currentNodeId)) {
            pickerIds.add(currentNodeId);
            pickerLabels.add(displayNode(currentNodeId));
        }

        if (pickerIds.isEmpty()) {
            Toast.makeText(this, "No grid nodes available for editing.", Toast.LENGTH_LONG).show();
            return;
        }

        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        int spacing = dp(14);
        form.setPadding(dp(2), spacing, dp(2), dp(2));

        TextView summary = new TextView(this);
        summary.setText(bookingSummary(item));
        summary.setTextColor(Color.rgb(96, 117, 109));
        summary.setTextSize(13);
        summary.setLineSpacing(dp(3), 1f);
        form.addView(summary);

        TextView nodeLabel = dialogLabel("Grid node");
        LinearLayout.LayoutParams labelParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        labelParams.setMargins(0, dp(16), 0, dp(6));
        form.addView(nodeLabel, labelParams);

        Spinner nodePicker = new Spinner(this);
        nodePicker.setBackgroundResource(R.drawable.material_field_surface);
        nodePicker.setPadding(dp(12), 0, dp(12), 0);
        ArrayAdapter<String> nodeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, pickerLabels);
        nodeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        nodePicker.setAdapter(nodeAdapter);
        int selectedIndex = pickerIds.indexOf(currentNodeId);
        if (selectedIndex >= 0) nodePicker.setSelection(selectedIndex);
        form.addView(nodePicker, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)));

        TextView energyLabel = dialogLabel("Energy amount (kWh)");
        LinearLayout.LayoutParams energyLabelParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        energyLabelParams.setMargins(0, dp(14), 0, dp(6));
        form.addView(energyLabel, energyLabelParams);

        EditText amount = new EditText(this);
        amount.setBackgroundResource(R.drawable.input_surface);
        amount.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
        amount.setSingleLine(true);
        amount.setTextColor(Color.rgb(9, 44, 35));
        amount.setTextSize(15);
        amount.setPadding(dp(14), 0, dp(14), 0);
        double currentAmount = item.optDouble("energyKwh", 0);
        amount.setText(currentAmount == 0 ? "" : String.valueOf(currentAmount));
        form.addView(amount, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)));

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Edit booking")
                .setView(form)
                .setPositiveButton("Save changes", null)
                .setNegativeButton("Close", null)
                .create();

        dialog.setOnShowListener(view -> {
            Button save = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            Button close = dialog.getButton(AlertDialog.BUTTON_NEGATIVE);
            save.setTextColor(Color.rgb(0, 83, 63));
            close.setTextColor(Color.rgb(96, 117, 109));
            save.setOnClickListener(v -> {
                int index = nodePicker.getSelectedItemPosition();
                if (index < 0 || index >= pickerIds.size()) {
                    Toast.makeText(this, "Select a grid node.", Toast.LENGTH_LONG).show();
                    return;
                }
                updateReservation(reservationId, pickerIds.get(index), amount.getText().toString().trim());
                dialog.dismiss();
            });
        });
        dialog.show();
    }

    private TextView dialogLabel(String value) {
        TextView label = new TextView(this);
        label.setText(value);
        label.setTextColor(Color.rgb(9, 44, 35));
        label.setTextSize(12);
        label.setTypeface(appTypeface(true));
        return label;
    }

    private void confirmCancelBooking(String id, String nodeName) {
        if (id == null || id.isEmpty()) {
            Toast.makeText(this, "Booking ID is missing.", Toast.LENGTH_LONG).show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Cancel booking?")
                .setMessage("This will cancel the reservation for " + nodeName + ". The 12-hour rule still applies.")
                .setPositiveButton("Cancel booking", (dialog, which) -> cancelReservation(id))
                .setNegativeButton("Keep booking", null)
                .show();
    }

    private void updateReservation(String id, String selectedNodeId, String energyValue) {
        if (id == null || id.isEmpty()) return;
        if (selectedNodeId == null || selectedNodeId.isEmpty() || energyValue == null || energyValue.isEmpty()) {
            Toast.makeText(this, "Select a node and enter an energy amount.", Toast.LENGTH_LONG).show();
            return;
        }
        new Thread(() -> {
            try {
                Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
                JSONObject body = new JSONObject();
                body.put("prosumerNic", nic);
                body.put("nodeId", selectedNodeId);
                body.put("slotStartUtc", start.toString());
                body.put("slotEndUtc", start.plus(1, ChronoUnit.HOURS).toString());
                body.put("energyKwh", Double.parseDouble(energyValue));
                JSONObject response = api.put("/reservations/mobile/" + id, body);
                runOnUiThread(() -> updateActionSummary("Booking updated", response));
                loadHistory();
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void updateActionSummary(String action, JSONObject response) {
        JSONObject data = response.optJSONObject("data");
        StringBuilder summary = new StringBuilder();
        summary.append(action).append("\n").append(response.optString("message", "Completed"));
        if (data != null) {
            summary.append("\n\nNode: ").append(displayNode(data.optString("nodeId")));
            summary.append("\nEnergy: ").append(data.optDouble("energyKwh")).append(" kWh");
            summary.append("\nSlot: ").append(compactDate(data.optString("slotStartUtc")));
            summary.append("\nStatus: ").append(statusLabel(data));
            String code = data.optString("transactionCode");
            if (!code.isEmpty()) summary.append("\nQR: Available");
        }
        ((TextView) findViewById(R.id.actionSummary)).setText(summary.toString());
        findViewById(R.id.summarySection).setVisibility(View.VISIBLE);
        Toast.makeText(this, response.optString("message", action), Toast.LENGTH_LONG).show();
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

    private JSONArray filterRows(String query, String mode) {
        JSONArray filtered = new JSONArray();
        String needle = query == null ? "" : query.toLowerCase();
        for (int i = 0; i < currentRows.length(); i++) {
            JSONObject item = currentRows.optJSONObject(i);
            if (item == null) continue;
            String status = statusLabel(item);
            boolean active = "Pending".equals(status) || "Approved".equals(status);
            boolean include = true;
            if ("active".equals(mode)) include = active;
            if ("pending".equals(mode)) include = "Pending".equals(status);
            if ("cancelled".equals(mode)) include = "Cancelled".equals(status);
            if (!include) continue;
            String haystack = (displayNode(item.optString("nodeId")) + " " + status + " " + item.optString("transactionCode") + " " + item.optDouble("energyKwh")).toLowerCase();
            if (!needle.isEmpty() && !haystack.contains(needle)) continue;
            filtered.put(item);
        }
        return filtered;
    }

    private void renderRows(JSONArray rows, boolean offline) {
        int approved = 0;
        int pending = 0;
        String qrValue = "";
        JSONObject next = null;
        JSONObject recent = null;
        bookingIds.clear();
        bookingLabels.clear();
        bookingItems.clear();

        for (int i = 0; i < rows.length(); i++) {
            JSONObject item = rows.optJSONObject(i);
            if (item == null) continue;
            String status = statusLabel(item);
            String id = item.optString("id");
            if (!id.isEmpty()) {
                bookingIds.add(id);
                bookingItems.add(item);
                bookingLabels.add(status + " | " + displayNode(item.optString("nodeId")) + " | " + item.optDouble("energyKwh") + " kWh");
            }
            if ("Approved".equals(status)) {
                approved++;
                if (qrValue.isEmpty()) qrValue = item.optString("transactionCode");
            }
            if ("Pending".equals(status)) pending++;
            if (next == null && ("Approved".equals(status) || "Pending".equals(status))) next = item;
            if (recent == null) recent = item;
        }

        if (bookingLabels.isEmpty()) bookingLabels.add("No bookings available");
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, bookingLabels);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        bookingSelector.setAdapter(adapter);
        populateManageFields(bookingSelector.getSelectedItemPosition());

        String mode = offline ? " | Offline cache" : "";
        ((TextView) findViewById(R.id.summary)).setText("Ready " + approved + " | Pending " + pending + " | Total " + rows.length() + mode);
        ((TextView) findViewById(R.id.approvedCount)).setText(String.valueOf(approved));
        ((TextView) findViewById(R.id.pendingCount)).setText(String.valueOf(pending));
        ((TextView) findViewById(R.id.totalCount)).setText(String.valueOf(rows.length()));
        ((TextView) findViewById(R.id.nextBooking)).setText(next == null ? "No upcoming booking yet." : bookingSummary(next));
        ((TextView) findViewById(R.id.recentBooking)).setText(recent == null ? "Your latest reservation will appear here." : bookingSummary(recent));
        ((TextView) findViewById(R.id.history)).setText("");
        renderBookingCards(rows);
        renderQr(qrValue);
    }

    private void renderBookingCards(JSONArray rows) {
        historyList.removeAllViews();
        if (rows.length() == 0) {
            historyList.addView(cardText("No bookings yet\nBook a slot and it will appear here with its status and QR availability."));
            return;
        }
        for (int i = 0; i < rows.length(); i++) {
            JSONObject item = rows.optJSONObject(i);
            if (item == null) continue;
            historyList.addView(bookingCard(item, i));
        }
    }

    private View bookingCard(JSONObject item, int index) {
        MaterialCardView card = new MaterialCardView(this);
        card.setCardBackgroundColor(Color.WHITE);
        card.setRadius(dp(18));
        card.setCardElevation(0);
        card.setStrokeWidth(dp(1));
        card.setStrokeColor(Color.rgb(221, 232, 226));
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        cardParams.setMargins(0, 0, 0, dp(12));
        card.setLayoutParams(cardParams);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(16), dp(14), dp(16), dp(14));
        card.addView(content);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(android.view.Gravity.CENTER_VERTICAL);

        TextView title = new TextView(this);
        title.setText(displayNode(item.optString("nodeId")));
        title.setTextColor(Color.rgb(9, 44, 35));
        title.setTextSize(16);
        title.setTypeface(appTypeface(true));
        title.setSingleLine(false);
        row.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        TextView chip = new TextView(this);
        String status = statusLabel(item);
        chip.setText(status);
        chip.setTextSize(11);
        chip.setTypeface(appTypeface(true));
        chip.setTextColor(statusTextColor(status));
        chip.setBackgroundResource(statusBackground(status));
        chip.setPadding(dp(11), dp(5), dp(11), dp(5));
        row.addView(chip);
        content.addView(row);

        TextView details = new TextView(this);
        details.setText(item.optDouble("energyKwh") + " kWh  |  " + compactDate(item.optString("slotStartUtc")));
        details.setTextColor(Color.rgb(96, 117, 109));
        details.setTextSize(13);
        details.setPadding(0, dp(9), 0, 0);
        content.addView(details);

        TextView qr = new TextView(this);
        String code = item.optString("transactionCode");
        qr.setText((code == null || code.isEmpty()) ? "QR will appear after approval" : "QR ready for dispatch");
        qr.setTextColor(Color.rgb(22, 59, 50));
        qr.setTextSize(13);
        qr.setPadding(0, dp(6), 0, 0);
        content.addView(qr);

        if ("Approved".equals(status) && code != null && !code.isEmpty()) {
            MaterialButton showQr = materialActionButton("Show QR", Color.rgb(0, 83, 63), Color.WHITE, Color.rgb(0, 83, 63));
            LinearLayout.LayoutParams qrParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(44));
            qrParams.setMargins(0, dp(14), 0, 0);
            content.addView(showQr, qrParams);
            showQr.setOnClickListener(v -> showBookingQr(item));
        }

        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setPadding(0, dp(10), 0, 0);

        MaterialButton edit = materialActionButton("Edit", Color.rgb(238, 247, 242), Color.rgb(0, 83, 63), Color.rgb(216, 234, 225));
        MaterialButton cancel = materialActionButton("Cancel", Color.rgb(255, 245, 245), Color.rgb(180, 35, 24), Color.rgb(244, 199, 199));
        actions.addView(edit, new LinearLayout.LayoutParams(0, dp(44), 1));
        LinearLayout.LayoutParams cancelParams = new LinearLayout.LayoutParams(0, dp(44), 1);
        cancelParams.setMargins(dp(8), 0, 0, 0);
        actions.addView(cancel, cancelParams);
        content.addView(actions);

        View.OnClickListener editAction = v -> openEditBookingDialog(item);
        edit.setOnClickListener(editAction);
        card.setOnClickListener(editAction);
        cancel.setOnClickListener(v -> confirmCancelBooking(item.optString("id"), displayNode(item.optString("nodeId"))));
        return card;
    }

    private void showBookingQr(JSONObject item) {
        String code = item.optString("transactionCode");
        if (code == null || code.isEmpty()) {
            Toast.makeText(this, "This booking does not have an approved QR yet.", Toast.LENGTH_LONG).show();
            return;
        }

        try {
            Bitmap bitmap = new BarcodeEncoder().encodeBitmap(code, BarcodeFormat.QR_CODE, 720, 720);

            LinearLayout content = new LinearLayout(this);
            content.setOrientation(LinearLayout.VERTICAL);
            content.setPadding(dp(6), dp(10), dp(6), 0);

            ImageView image = new ImageView(this);
            image.setImageBitmap(bitmap);
            image.setBackgroundResource(R.drawable.surface_muted);
            image.setPadding(dp(14), dp(14), dp(14), dp(14));
            image.setAdjustViewBounds(true);
            LinearLayout.LayoutParams imageParams = new LinearLayout.LayoutParams(dp(250), dp(250));
            imageParams.gravity = android.view.Gravity.CENTER_HORIZONTAL;
            content.addView(image, imageParams);

            TextView details = new TextView(this);
            details.setText("Booking QR for " + displayNode(item.optString("nodeId"))
                    + "\n" + item.optDouble("energyKwh") + " kWh"
                    + "\n" + compactDate(item.optString("slotStartUtc"))
                    + "\n\n" + code);
            details.setTextColor(Color.rgb(22, 59, 50));
            details.setTextSize(13);
            details.setLineSpacing(dp(3), 1f);
            details.setGravity(android.view.Gravity.CENTER_HORIZONTAL);
            details.setTextIsSelectable(true);
            LinearLayout.LayoutParams detailParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            detailParams.setMargins(0, dp(14), 0, 0);
            content.addView(details, detailParams);

            AlertDialog dialog = new AlertDialog.Builder(this)
                    .setTitle("Transaction QR")
                    .setView(content)
                    .setPositiveButton("Close", null)
                    .create();
            dialog.setOnShowListener(view -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(Color.rgb(0, 83, 63)));
            dialog.show();
        } catch (Exception ex) {
            Toast.makeText(this, "QR could not be generated: " + ex.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private MaterialButton materialActionButton(String label, int background, int textColor, int strokeColor) {
        MaterialButton button = new MaterialButton(this);
        button.setText(label);
        button.setTextSize(13);
        button.setTypeface(appTypeface(true));
        button.setTextColor(textColor);
        button.setBackgroundTintList(ColorStateList.valueOf(background));
        button.setStrokeColor(ColorStateList.valueOf(strokeColor));
        button.setStrokeWidth(dp(1));
        button.setCornerRadius(dp(12));
        button.setMinHeight(0);
        button.setMinWidth(0);
        button.setInsetTop(0);
        button.setInsetBottom(0);
        button.setElevation(0);
        button.setStateListAnimator(null);
        button.setTranslationZ(0);
        return button;
    }

    private TextView cardText(String text) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(14);
        view.setTextColor(Color.rgb(22, 59, 50));
        view.setLineSpacing(dp(3), 1f);
        view.setBackgroundResource(R.drawable.surface_muted);
        view.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 0, 0, dp(10));
        view.setLayoutParams(params);
        return view;
    }

    private String bookingSummary(JSONObject item) {
        String code = item.optString("transactionCode");
        String qr = code == null || code.isEmpty() ? "QR not available yet" : "QR ready for dispatch";
        return statusLabel(item) + " booking\n"
                + displayNode(item.optString("nodeId")) + "\n"
                + item.optDouble("energyKwh") + " kWh\n"
                + compactDate(item.optString("slotStartUtc")) + "\n"
                + qr;
    }

    private String displayNode(String id) {
        String name = nodeNames.get(id);
        if (name != null && !name.isEmpty()) return name;
        return "Grid node";
    }

    private int statusBackground(String status) {
        if ("Approved".equals(status) || "Completed".equals(status)) return R.drawable.status_approved_surface;
        if ("Cancelled".equals(status)) return R.drawable.status_cancelled_surface;
        return R.drawable.status_pending_surface;
    }

    private int statusTextColor(String status) {
        if ("Approved".equals(status) || "Completed".equals(status)) return Color.rgb(0, 83, 63);
        if ("Cancelled".equals(status)) return Color.rgb(180, 35, 24);
        return Color.rgb(126, 86, 0);
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

    private void renderQr(String qrValue) {
        TextView qrText = findViewById(R.id.qrText);
        ImageView qrImage = findViewById(R.id.qrImage);
        if (qrValue == null || qrValue.isEmpty()) {
            qrImage.setImageBitmap(null);
            qrText.setText("No approved transaction QR available yet.");
            return;
        }
        try {
            Bitmap bitmap = new BarcodeEncoder().encodeBitmap(qrValue, BarcodeFormat.QR_CODE, 520, 520);
            qrImage.setImageBitmap(bitmap);
            qrText.setText(qrValue);
        } catch (Exception ex) {
            qrText.setText("QR could not be generated: " + ex.getMessage());
        }
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
            values.put("status", statusLabel(item));
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

    private Typeface appTypeface(boolean bold) {
        Typeface selected = bold ? sourceSansBold : sourceSansRegular;
        if (selected != null) return selected;
        return bold ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT;
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }
}
