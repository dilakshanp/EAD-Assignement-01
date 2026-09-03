package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.ContentValues;
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
        setContentView(R.layout.activity_register);
        api = new ApiClient(this);
        localDb = new LocalDb(this);

        EditText nic = findViewById(R.id.nic);
        EditText fullName = findViewById(R.id.fullName);
        EditText phone = findViewById(R.id.phone);
        EditText email = findViewById(R.id.email);
        EditText address = findViewById(R.id.address);
        EditText capacity = findViewById(R.id.capacity);
        Button save = findViewById(R.id.saveButton);
        Button deactivate = findViewById(R.id.deactivateButton);

        save.setOnClickListener(v -> new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("nic", nic.getText().toString());
                body.put("fullName", fullName.getText().toString());
                body.put("phone", phone.getText().toString());
                body.put("email", email.getText().toString());
                body.put("address", address.getText().toString());
                body.put("solarCapacityKw", Double.parseDouble(capacity.getText().toString()));
                body.put("status", "Active");
                JSONObject response = api.put("/prosumers/" + nic.getText(), body);
                saveLocal(nic.getText().toString(), fullName.getText().toString(), email.getText().toString(), phone.getText().toString());
                runOnUiThread(() -> Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show());
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start());

        deactivate.setOnClickListener(v -> new Thread(() -> {
            try {
                JSONObject response = api.post("/prosumers/" + nic.getText() + "/request-deactivation", new JSONObject());
                runOnUiThread(() -> Toast.makeText(this, response.optString("message"), Toast.LENGTH_LONG).show());
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start());
    }

    private void saveLocal(String nic, String name, String email, String phone) {
        SQLiteDatabase db = localDb.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("nic", nic);
        values.put("full_name", name);
        values.put("email", email);
        values.put("phone", phone);
        db.insertWithOnConflict("local_user", null, values, SQLiteDatabase.CONFLICT_REPLACE);
    }
}
