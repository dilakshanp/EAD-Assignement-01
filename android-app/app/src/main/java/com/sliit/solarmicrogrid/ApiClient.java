package com.sliit.solarmicrogrid;

import android.content.Context;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class ApiClient {
    private final String baseUrl;

    public ApiClient(Context context) {
        baseUrl = context.getString(R.string.api_base);
    }

    public JSONObject post(String path, JSONObject body) throws Exception {
        return send("POST", path, body);
    }

    public JSONObject put(String path, JSONObject body) throws Exception {
        return send("PUT", path, body);
    }

    public String get(String path) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(baseUrl + path).openConnection();
        conn.setRequestMethod("GET");
        return read(conn);
    }

    private JSONObject send(String method, String path, JSONObject body) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(baseUrl + path).openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.toString().getBytes());
        }
        return new JSONObject(read(conn));
    }

    private String read(HttpURLConnection conn) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder result = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) result.append(line);
        return result.toString();
    }
}
