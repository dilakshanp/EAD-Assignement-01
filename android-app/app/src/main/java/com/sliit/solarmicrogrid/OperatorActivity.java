package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

public class OperatorActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator);
        ApiClient api = new ApiClient(this);
        EditText qr = findViewById(R.id.qrCode);
        TextView result = findViewById(R.id.result);
        Button finalize = findViewById(R.id.finalizeButton);

        finalize.setOnClickListener(v -> new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("transactionCode", qr.getText().toString());
                JSONObject response = api.post("/reservations/complete-by-qr", body);
                runOnUiThread(() -> result.setText(response.toString()));
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start());
    }
}
