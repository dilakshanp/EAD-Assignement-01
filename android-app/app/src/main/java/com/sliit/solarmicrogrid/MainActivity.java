package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private ApiClient api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        api = new ApiClient(this);

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
                        Intent intent = new Intent(this, DashboardActivity.class);
                        intent.putExtra("nic", username.getText().toString());
                        startActivity(intent);
                    } else {
                        Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show();
                    }
                });
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start());

        register.setOnClickListener(v -> startActivity(new Intent(this, RegisterActivity.class)));
        operator.setOnClickListener(v -> startActivity(new Intent(this, OperatorActivity.class)));
    }
}
