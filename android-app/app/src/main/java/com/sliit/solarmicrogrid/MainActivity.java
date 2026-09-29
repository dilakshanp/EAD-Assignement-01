package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String SESSION = "smart_solar_session";
    private ApiClient api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiHelper.applyTheme(this);
        setContentView(R.layout.activity_main);
        api = new ApiClient(this);
        UiHelper.setupHeader(this, null);

        EditText username = findViewById(R.id.username);
        EditText password = findViewById(R.id.password);
        Button login = findViewById(R.id.loginButton);
        Button register = findViewById(R.id.registerButton);
        Button operator = findViewById(R.id.operatorButton);

        login.setOnClickListener(v -> new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("username", username.getText().toString());
                body.put("password", password.getText().toString());
                JSONObject response = api.post("/auth/login", body);
                runOnUiThread(() -> {
                    if (response.optBoolean("success")) {
                        JSONObject user = response.optJSONObject("data");
                        String role = user == null ? "" : user.optString("role", "");
                        String prosumerNic = user == null ? username.getText().toString() : user.optString("prosumerNic", username.getText().toString());
                        saveSession(username.getText().toString(), role, prosumerNic);

                        if (isOperatorRole(role)) {
                            openLoggedInScreen(new Intent(this, OperatorActivity.class));
                        } else {
                            Intent intent = new Intent(this, DashboardActivity.class);
                            intent.putExtra("nic", prosumerNic.isEmpty() ? username.getText().toString() : prosumerNic);
                            openLoggedInScreen(intent);
                        }
                    } else {
                        Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show();
                    }
                });
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start());

        register.setOnClickListener(v -> startActivity(new Intent(this, RegisterActivity.class)));
        operator.setOnClickListener(v -> {
            String role = getSharedPreferences(SESSION, Context.MODE_PRIVATE).getString("role", "");
            if (isOperatorRole(role)) {
                openLoggedInScreen(new Intent(this, OperatorActivity.class));
            } else {
                Toast.makeText(this, "Login as Backoffice or Grid Operator to use QR verification.", Toast.LENGTH_LONG).show();
            }
        });
    }


    private void openLoggedInScreen(Intent intent) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void saveSession(String username, String role, String prosumerNic) {
        SharedPreferences.Editor editor = getSharedPreferences(SESSION, Context.MODE_PRIVATE).edit();
        editor.putString("username", username);
        editor.putString("role", role);
        editor.putString("prosumerNic", prosumerNic);
        editor.apply();
    }

    private boolean isOperatorRole(String role) {
        return "Backoffice".equals(role) || "GridOperator".equals(role);
    }
}
