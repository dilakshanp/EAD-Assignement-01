package com.sliit.solarmicrogrid;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class LocalDb extends SQLiteOpenHelper {
    public LocalDb(Context context) {
        super(context, "smart_solar.db", null, 2);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE local_user(nic TEXT PRIMARY KEY, full_name TEXT, email TEXT, phone TEXT)");
        db.execSQL("CREATE TABLE cached_reservation(id TEXT PRIMARY KEY, nic TEXT, node_id TEXT, status TEXT, transaction_code TEXT, slot_start TEXT, energy_kwh REAL)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS local_user");
        db.execSQL("DROP TABLE IF EXISTS cached_reservation");
        onCreate(db);
    }
}
