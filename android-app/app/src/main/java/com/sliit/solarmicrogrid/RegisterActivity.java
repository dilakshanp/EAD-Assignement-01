package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.database.sqlite.SQLiteDatabase;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import org.json.JSONObject;

public class RegisterActivity extends Activity {
    private ApiClient api;
    private LocalDb localDb;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiHelper.applyTheme(this);
        setContentView(R.layout.activity_register);
        api = new ApiClient(this);
        localDb = new LocalDb(this);

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
        deactivate.setVisibility(android.view.View.GONE);

        save.setOnClickListener(v -> {
            String nicValue = nic.getText().toString().trim();
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
            if (passwordValue.length() < 6) {
                Toast.makeText(this, "Password must contain at least 6 characters.", Toast.LENGTH_LONG).show();
                return;
            }
            if (!passwordValue.equals(confirmPasswordValue)) {
                Toast.makeText(this, "Passwords do not match.", Toast.LENGTH_LONG).show();
                return;
            }

            save.setEnabled(false);
            save.setText("Creating...");
            new Thread(() -> {
                try {
                    JSONObject body = new JSONObject();
                    body.put("nic", nicValue);
                    body.put("fullName", nameValue);
                    body.put("phone", phoneValue);
                    body.put("email", emailValue);
                    body.put("address", addressValue);
                    body.put("solarCapacityKw", Double.parseDouble(capacityValue));
                    body.put("password", passwordValue);
                    body.put("status", "Active");
                    JSONObject response = api.post("/prosumers/register", body);

                    runOnUiThread(() -> {
                        if (response.optBoolean("success")) {
                            saveLocal(nicValue, nameValue, emailValue, phoneValue, addressValue, Double.parseDouble(capacityValue));
                            Toast.makeText(this, "Profile saved. Login with your NIC or email and password.", Toast.LENGTH_LONG).show();
                            Intent intent = new Intent(this, MainActivity.class);
                            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                            finish();
                        } else {
                            save.setEnabled(true);
                            save.setText("Save account");
                            Toast.makeText(this, response.optString("message", "Profile could not be saved."), Toast.LENGTH_LONG).show();
                        }
                    });
                } catch (Exception ex) {
                    runOnUiThread(() -> {
                        save.setEnabled(true);
                        save.setText("Save account");
                        Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show();
                    });
                }
            }).start();
        });
    }

    private void saveLocal(String nic, String name, String email, String phone, String address, double capacity) {
        localDb.saveUser(nic, name, email, phone, address, capacity, "Active");
    }
}
