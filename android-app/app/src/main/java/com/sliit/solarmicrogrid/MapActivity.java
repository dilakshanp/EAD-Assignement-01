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
import com.google.android.gms.maps.model.LatLngBounds;
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
    private JSONArray loadedNodes = new JSONArray();
    private boolean centerOnLocation = false;
    private boolean nearbyNodesFocused = false;
    private boolean showingMyLocation = false;
    private String locationMessage = "Finding your location...";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiHelper.applyTheme(this);
        setContentView(R.layout.activity_map);
        api = new ApiClient(this);
        UiHelper.setupHeader(this, null);
        status = findViewById(R.id.mapStatus);
        findViewById(R.id.myLocationButton).setOnClickListener(v -> {
            showingMyLocation = true;
            centerOnLocation = true;
            requestLocation();
        });
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        MapFragment mapFragment = (MapFragment) getFragmentManager().findFragmentById(R.id.map);
        if (mapFragment != null) mapFragment.getMapAsync(this);
    }

    @Override
    public void onMapReady(GoogleMap map) {
        googleMap = map;
        googleMap.getUiSettings().setMyLocationButtonEnabled(true);
        LatLng sriLanka = new LatLng(7.8731, 80.7718);
        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(sriLanka, 7f));
        requestLocation();
        loadNodes();
    }

    private void loadNodes() {
        new Thread(() -> {
            try {
                JSONArray nodes = new JSONArray(api.get("/nodes"));
                runOnUiThread(() -> {
                    loadedNodes = nodes;
                    renderNodes(nodes);
                });
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(this, ex.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void renderNodes(JSONArray nodes) {
        if (googleMap == null) return;
        googleMap.clear();
        LatLng first = null;
        LatLngBounds.Builder nodeBounds = new LatLngBounds.Builder();
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
            nodeBounds.include(position);
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
            googleMap.addMarker(new MarkerOptions().position(here).title("Your location").zIndex(100f).icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE)));
            if (centerOnLocation) {
                googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(here, 13f));
                centerOnLocation = false;
            }
            status.setText(nearby == 0 ? "No active grid nodes within " + (int) NEARBY_RADIUS_KM + " km."
                    : nearby + " active grid nodes within " + (int) NEARBY_RADIUS_KM + " km.");
        } else {
            status.setText(active + " active grid nodes loaded. " + locationMessage);
        }
        if (!showingMyLocation && !nearbyNodesFocused && first != null) {
            if (nearby == 1) {
                googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(first, 13f));
            } else {
                android.view.View mapView = findViewById(R.id.map);
                mapView.post(() -> {
                    if (isFinishing() || isDestroyed() || showingMyLocation) return;
                    int width = mapView.getWidth();
                    int height = mapView.getHeight();
                    int padding = (int) (32 * getResources().getDisplayMetrics().density);
                    if (width > padding * 2 && height > padding * 2) {
                        googleMap.animateCamera(CameraUpdateFactory.newLatLngBounds(nodeBounds.build(), width, height, padding));
                    }
                });
            }
            // Reframe once a location fix becomes available and filters the nodes.
            nearbyNodesFocused = currentLocation != null;
        }
    }

    private void requestLocation() {
        if (googleMap == null) return;
        boolean fine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarse = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        if (!fine && !coarse) {
            locationMessage = "Allow location access to show your position.";
            renderNodes(loadedNodes);
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_REQUEST);
            return;
        }
        try {
            googleMap.setMyLocationEnabled(true);
            locationManager.removeUpdates(this);
            Location latest = null;
            boolean enabled = false;
            for (String provider : new String[]{LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER}) {
                if (LocationManager.GPS_PROVIDER.equals(provider) && !fine) continue;
                try {
                    if (!locationManager.isProviderEnabled(provider)) continue;
                    enabled = true;
                    locationManager.requestLocationUpdates(provider, 5000, 10, this);
                    Location last = locationManager.getLastKnownLocation(provider);
                    // Ignore old fixes rather than presenting them as the current position.
                    if (last != null && android.os.SystemClock.elapsedRealtimeNanos() - last.getElapsedRealtimeNanos()
                            <= 120_000_000_000L && (latest == null || last.getTime() > latest.getTime())) {
                        latest = last;
                    }
                } catch (IllegalArgumentException | SecurityException ignored) {
                    // Another available provider can still supply a location.
                }
            }
            locationMessage = enabled ? "Finding your location..." : "Turn on phone location services, then tap My location.";
            if (!enabled) currentLocation = null;
            if (latest != null) currentLocation = latest;
            renderNodes(loadedNodes);
        } catch (SecurityException ignored) {
            locationMessage = "Allow location access in app settings, then tap My location.";
            renderNodes(loadedNodes);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_REQUEST) {
            for (int result : grantResults) {
                if (result == PackageManager.PERMISSION_GRANTED) {
                    requestLocation();
                    return;
                }
            }
            locationMessage = "Location permission denied. Enable it in app settings to show your position.";
            renderNodes(loadedNodes);
        }
    }

    @Override protected void onResume() {
        super.onResume();
        if (googleMap != null) requestLocation();
    }

    @Override protected void onPause() {
        if (locationManager != null) locationManager.removeUpdates(this);
        super.onPause();
    }

    @Override public void onProviderEnabled(String provider) {
        requestLocation();
    }

    @Override public void onProviderDisabled(String provider) {
        requestLocation();
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
