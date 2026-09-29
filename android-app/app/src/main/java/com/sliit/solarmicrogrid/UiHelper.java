package com.sliit.solarmicrogrid;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.Button;
import android.widget.PopupMenu;

public final class UiHelper {
    private static final String SESSION = "smart_solar_session";
    private static final String PREFS = "smart_solar_ui";
    private static final String DARK = "dark_mode";

    private UiHelper() {}

    public static void applyTheme(Activity activity) {
        activity.setTheme(R.style.AppTheme);
    }

    public static boolean isDark(Context context) {
        return false;
    }

    public static void setupHeader(Activity activity, String nic) {
        Button theme = activity.findViewById(R.id.themeToggleButton);
        Button profile = activity.findViewById(R.id.profileButton);
        if (theme != null) {
            theme.setVisibility(View.GONE);
        }
        if (profile != null) {
            profile.setOnClickListener(v -> showProfileMenu(activity, v, nic));
        }
    }

    private static void showProfileMenu(Activity activity, View anchor, String nic) {
        PopupMenu menu = new PopupMenu(activity, anchor);
        menu.getMenu().add("Account settings");
        menu.getMenu().add("Sign out");
        menu.setOnMenuItemClickListener(item -> {
            String title = item.getTitle().toString();
            if ("Account settings".equals(title)) {
                Intent intent = new Intent(activity, AccountSettingsActivity.class);
                String resolvedNic = nic;
                if (resolvedNic == null || resolvedNic.isEmpty()) {
                    resolvedNic = activity.getSharedPreferences(SESSION, Context.MODE_PRIVATE).getString("prosumerNic", "");
                }
                if (resolvedNic != null && !resolvedNic.isEmpty()) intent.putExtra("nic", resolvedNic);
                activity.startActivity(intent);
                return true;
            }
            activity.getSharedPreferences(SESSION, Context.MODE_PRIVATE).edit().clear().apply();
            Intent intent = new Intent(activity, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            activity.startActivity(intent);
            activity.finish();
            return true;
        });
        menu.show();
    }
}
