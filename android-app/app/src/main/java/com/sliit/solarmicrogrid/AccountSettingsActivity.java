package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import org.json.JSONObject;

public class AccountSettingsActivity extends Activity {
    private ApiClient api;
    private LocalDb localDb;
    private String nicValue;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiHelper.applyTheme(this);
        setContentView(R.layout.activity_account_settings);
        api = new ApiClient(this);
        localDb = new LocalDb(this);
        UiHelper.setupHeader(this, getIntent().getStringExtra("nic"));

        EditText nic = findViewById(R.id.nic);
        EditText fullName = findViewById(R.id.fullName);
        EditText phone = findViewById(R.id.phone);
        EditText email = findViewById(R.id.email);
        EditText address = findViewById(R.id.address);
        EditText capacity = findViewById(R.id.capacity);
        EditText password = findViewById(R.id.registerPassword);
        EditText confirmPassword = findViewById(R.id.confirmPassword);
        Button save = findViewById(R.id.saveButton);
        Button deactivate = findViewById(R.id.deactivateButton);

        nicValue = getIntent().getStringExtra("nic");
        if (nicValue == null || nicValue.isEmpty()) {
            nicValue = getSharedPreferences("smart_solar_session", MODE_PRIVATE).getString("prosumerNic", "");
        }
        nic.setText(nicValue);
        nic.setEnabled(false);
        password.setHint("New password optional");
        confirmPassword.setHint("Confirm new password");
        save.setText("Update profile");
        loadProfile(nicValue, fullName, phone, email, address, capacity);

        save.setOnClickListener(v -> updateProfile(nic, fullName, phone, email, address, capacity, password, confirmPassword, save));
        deactivate.setOnClickListener(v -> requestDeactivation(deactivate));
    }

    private void updateProfile(EditText nic, EditText fullName, EditText phone, EditText email, EditText address, EditText capacity, EditText password, EditText confirmPassword, Button save) {
        String nameValue = fullName.getText().toString().trim();
        String phoneValue = phone.getText().toString().trim();
        String emailValue = email.getText().toString().trim();
        String addressValue = address.getText().toString().trim();
        String capacityValue = capacity.getText().toString().trim();
        String passwordValue = password.getText().toString();
        String confirmPasswordValue = confirmPassword.getText().toString();

        if (nicValue.isEmpty() || nameValue.isEmpty() || capacityValue.isEmpty()) {
            Toast.makeText(this, "NIC, full name, and capacity are required.", Toast.LENGTH_LONG).show();
            return;
        }
        if (!passwordValue.equals(confirmPasswordValue)) {
            Toast.makeText(this, "Passwords do not match.", Toast.LENGTH_LONG).show();
            return;
        }
        save.setEnabled(false);
        save.setText("Updating...");
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("nic", nicValue);
                body.put("fullName", nameValue);
                body.put("phone", phoneValue);
                body.put("email", emailValue);
                body.put("address", addressValue);
                body.put("solarCapacityKw", Double.parseDouble(capacityValue));
                body.put("status", "Active");
                JSONObject response = api.put("/prosumers/mobile/" + nicValue, body);
                runOnUiThread(() -> {
                    save.setEnabled(true);
                    save.setText("Update profile");
                    if (response.optBoolean("success")) {
                        saveLocal(nicValue, nameValue, emailValue, phoneValue, addressValue, Double.parseDouble(capacityValue));
                        Toast.makeText(this, "Profile updated.", Toast.LENGTH_LONG).show();
                        Intent intent = new Intent(this, DashboardActivity.class);
                        intent.putExtra("nic", nicValue);
                        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        startActivity(intent);
                        finish();
                    } else {
                        Toast.makeText(this, response.optString("message", "Profile could not be updated."), Toast.LENGTH_LONG).show();
                    }
                });
            } catch (Exception ex) {
                runOnUiThread(() -> {
                    save.setEnabled(true);
                    save.setText("Update profile");
                    Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private void requestDeactivation(Button deactivate) {
        if (nicValue == null || nicValue.isEmpty()) {
            Toast.makeText(this, "No prosumer NIC found for this session.", Toast.LENGTH_LONG).show();
            return;
        }
        deactivate.setEnabled(false);
        deactivate.setText("Submitting...");
        new Thread(() -> {
            try {
                JSONObject response = api.post("/prosumers/" + nicValue + "/request-deactivation", new JSONObject());
                runOnUiThread(() -> Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show());
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            } finally {
                runOnUiThread(() -> {
                    deactivate.setEnabled(true);
                    deactivate.setText("Request deactivation");
                });
            }
        }).start();
    }

    private void loadProfile(String nicValue, EditText fullName, EditText phone, EditText email, EditText address, EditText capacity) {
        new Thread(() -> {
            try {
                JSONObject profile = new JSONObject(api.get("/prosumers/" + nicValue));
                localDb.saveUser(nicValue, profile.optString("fullName"), profile.optString("email"), profile.optString("phone"), profile.optString("address"), profile.optDouble("solarCapacityKw"), profile.optString("status", "Active"));
                runOnUiThread(() -> {
                    fullName.setText(profile.optString("fullName"));
                    phone.setText(profile.optString("phone"));
                    email.setText(profile.optString("email"));
                    address.setText(profile.optString("address"));
                    capacity.setText(String.valueOf(profile.optDouble("solarCapacityKw")));
                });
            } catch (Exception ex) {
                Cursor cursor = localDb.getUser(nicValue);
                try {
                    if (cursor.moveToFirst()) {
                        String cachedName = cursor.getString(cursor.getColumnIndexOrThrow("full_name"));
                        String cachedPhone = cursor.getString(cursor.getColumnIndexOrThrow("phone"));
                        String cachedEmail = cursor.getString(cursor.getColumnIndexOrThrow("email"));
                        String cachedAddress = cursor.getString(cursor.getColumnIndexOrThrow("address"));
                        double cachedCapacity = cursor.getDouble(cursor.getColumnIndexOrThrow("solar_capacity_kw"));
                        runOnUiThread(() -> {
                            fullName.setText(cachedName);
                            phone.setText(cachedPhone);
                            email.setText(cachedEmail);
                            address.setText(cachedAddress);
                            capacity.setText(String.valueOf(cachedCapacity));
                            Toast.makeText(this, "Showing the last locally saved profile.", Toast.LENGTH_LONG).show();
                        });
                    } else {
                        runOnUiThread(() -> Toast.makeText(this, "Could not load profile: " + ex.getMessage(), Toast.LENGTH_LONG).show());
                    }
                } finally {
                    cursor.close();
                }
            }
        }).start();
    }

    private void saveLocal(String nic, String name, String email, String phone, String address, double capacity) {
        localDb.saveUser(nic, name, email, phone, address, capacity, "Active");
    }
}
