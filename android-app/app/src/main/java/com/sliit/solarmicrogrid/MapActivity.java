package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapFragment;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;

import org.json.JSONArray;
import org.json.JSONObject;

public class MapActivity extends Activity implements OnMapReadyCallback, LocationListener {
    private static final int LOCATION_REQUEST = 42;
    private static final double NEARBY_RADIUS_KM = 50.0;
    private ApiClient api;
    private GoogleMap googleMap;
    private TextView status;
    private LocationManager locationManager;
    private Location currentLocation;
    private JSONArray loadedNodes;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiHelper.applyTheme(this);
        setContentView(R.layout.activity_map);
        api = new ApiClient(this);
        UiHelper.setupHeader(this, null);
        status = findViewById(R.id.mapStatus);
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        MapFragment mapFragment = (MapFragment) getFragmentManager().findFragmentById(R.id.map);
        if (mapFragment != null) mapFragment.getMapAsync(this);
    }

    @Override
    public void onMapReady(GoogleMap map) {
        googleMap = map;
        googleMap.getUiSettings().setMyLocationButtonEnabled(true);
        requestLocation();
        LatLng sriLanka = new LatLng(7.8731, 80.7718);
        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(sriLanka, 7f));
        loadNodes();
    }

    private void loadNodes() {
        new Thread(() -> {
            try {
                JSONArray nodes = new JSONArray(api.get("/nodes"));
                loadedNodes = nodes;
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
        int nearby = 0;
        for (int i = 0; i < nodes.length(); i++) {
            JSONObject node = nodes.optJSONObject(i);
            if (node == null || !node.optBoolean("isActive", true)) continue;
            double lat = node.optDouble("latitude", 0);
            double lng = node.optDouble("longitude", 0);
            if (lat == 0 && lng == 0) continue;
            double distance = currentLocation == null ? 0 : distanceKm(currentLocation.getLatitude(), currentLocation.getLongitude(), lat, lng);
            if (currentLocation != null && distance > NEARBY_RADIUS_KM) continue;
            LatLng position = new LatLng(lat, lng);
            if (first == null) first = position;
            active++;
            nearby++;
            googleMap.addMarker(new MarkerOptions()
                    .position(position)
                    .title(node.optString("name", "Grid node"))
                    .snippet(node.optString("locationName") + " | " + node.optDouble("capacityKwh") + " kWh | " + node.optInt("batteryStorageSlots") + " slots"));
        }
        if (currentLocation != null) {
            LatLng here = new LatLng(currentLocation.getLatitude(), currentLocation.getLongitude());
            googleMap.addMarker(new MarkerOptions().position(here).title("Your location").icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)));
            googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(here, 10f));
            status.setText(nearby + " active grid nodes within " + (int) NEARBY_RADIUS_KM + " km.");
        } else {
            if (first != null) googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(first, 11f));
            status.setText(active + " active grid nodes loaded. Allow location to filter nearby nodes.");
        }
    }

    private void requestLocation() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_REQUEST);
            return;
        }
        try {
            googleMap.setMyLocationEnabled(true);
            locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 5000, 100, this);
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 100, this);
            Location last = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            if (last == null) last = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (last != null) {
                currentLocation = last;
                if (loadedNodes != null) renderNodes(loadedNodes);
            }
        } catch (SecurityException ignored) {
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_REQUEST) {
            for (int result : grantResults) {
                if (result == PackageManager.PERMISSION_GRANTED) {
                    requestLocation();
                    break;
                }
            }
        }
    }

    @Override public void onLocationChanged(Location location) {
        currentLocation = location;
        if (loadedNodes != null) renderNodes(loadedNodes);
    }

    @Override protected void onDestroy() {
        if (locationManager != null) locationManager.removeUpdates(this);
        super.onDestroy();
    }

    private double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
