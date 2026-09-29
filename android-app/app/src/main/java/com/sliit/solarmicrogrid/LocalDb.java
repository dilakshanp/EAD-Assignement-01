package com.sliit.solarmicrogrid;

import android.content.Context;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class LocalDb extends SQLiteOpenHelper {
    public LocalDb(Context context) {
        super(context, "smart_solar.db", null, 3);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE local_user(nic TEXT PRIMARY KEY, full_name TEXT, email TEXT, phone TEXT, address TEXT, solar_capacity_kw REAL, status TEXT, updated_at TEXT)");
        db.execSQL("CREATE TABLE cached_reservation(id TEXT PRIMARY KEY, nic TEXT, node_id TEXT, status TEXT, transaction_code TEXT, slot_start TEXT, energy_kwh REAL)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 3) {
            db.execSQL("ALTER TABLE local_user ADD COLUMN address TEXT");
            db.execSQL("ALTER TABLE local_user ADD COLUMN solar_capacity_kw REAL");
            db.execSQL("ALTER TABLE local_user ADD COLUMN status TEXT");
            db.execSQL("ALTER TABLE local_user ADD COLUMN updated_at TEXT");
        }
    }

    public void saveUser(String nic, String fullName, String email, String phone, String address, double solarCapacityKw, String status) {
        ContentValues values = new ContentValues();
        values.put("nic", nic);
        values.put("full_name", fullName);
        values.put("email", email);
        values.put("phone", phone);
        values.put("address", address);
        values.put("solar_capacity_kw", solarCapacityKw);
        values.put("status", status);
        values.put("updated_at", String.valueOf(System.currentTimeMillis()));
        getWritableDatabase().insertWithOnConflict("local_user", null, values, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public Cursor getUser(String nic) {
        return getReadableDatabase().query("local_user", null, "nic=?", new String[]{nic}, null, null, null, "1");
    }
}
