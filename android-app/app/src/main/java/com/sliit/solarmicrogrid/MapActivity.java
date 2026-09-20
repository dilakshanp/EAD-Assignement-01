package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapFragment;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONArray;
import org.json.JSONObject;

public class MapActivity extends Activity implements OnMapReadyCallback {
    private ApiClient api;
    private GoogleMap googleMap;
    private TextView status;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_map);
        api = new ApiClient(this);
        status = findViewById(R.id.mapStatus);
        MapFragment mapFragment = (MapFragment) getFragmentManager().findFragmentById(R.id.map);
        if (mapFragment != null) mapFragment.getMapAsync(this);
    }

    @Override
    public void onMapReady(GoogleMap map) {
        googleMap = map;
        LatLng sriLanka = new LatLng(7.8731, 80.7718);
        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(sriLanka, 7f));
        loadNodes();
    }

    private void loadNodes() {
        new Thread(() -> {
            try {
                JSONArray nodes = new JSONArray(api.get("/nodes"));
                runOnUiThread(() -> renderNodes(nodes));
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void renderNodes(JSONArray nodes) {
        if (googleMap == null) return;
        googleMap.clear();
        LatLng first = null;
        int active = 0;
        for (int i = 0; i < nodes.length(); i++) {
            JSONObject node = nodes.optJSONObject(i);
            if (node == null || !node.optBoolean("isActive", true)) continue;
            double lat = node.optDouble("latitude", 0);
            double lng = node.optDouble("longitude", 0);
            if (lat == 0 && lng == 0) continue;
            LatLng position = new LatLng(lat, lng);
            if (first == null) first = position;
            active++;
            googleMap.addMarker(new MarkerOptions()
                    .position(position)
                    .title(node.optString("name", "Grid node"))
                    .snippet(node.optString("locationName") + " | " + node.optDouble("capacityKwh") + " kWh | " + node.optInt("batteryStorageSlots") + " slots"));
        }
        if (first != null) googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(first, 11f));
        status.setText(active + " active grid nodes loaded from the central API.");
    }
}
