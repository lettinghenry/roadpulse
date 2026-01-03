package com.roadpulse.android.data.database;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class RoadPulseDatabase_Impl extends RoadPulseDatabase {
  private volatile RoadAnomalyDao _roadAnomalyDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(1) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `road_anomaly_events` (`id` TEXT NOT NULL, `created_at` INTEGER NOT NULL, `latitude` REAL NOT NULL, `longitude` REAL NOT NULL, `gps_accuracy_m` REAL NOT NULL, `speed_kmh` REAL NOT NULL, `heading_deg` REAL, `peak_accel_ms2` REAL NOT NULL, `impulse_duration_ms` INTEGER NOT NULL, `severity` INTEGER NOT NULL, `confidence` REAL NOT NULL, `device_model` TEXT NOT NULL, `android_version` TEXT NOT NULL, `session_id` TEXT NOT NULL, `synced` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '114d55b868870e3584c0bfdc59d8d184')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `road_anomaly_events`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsRoadAnomalyEvents = new HashMap<String, TableInfo.Column>(15);
        _columnsRoadAnomalyEvents.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("created_at", new TableInfo.Column("created_at", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("latitude", new TableInfo.Column("latitude", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("longitude", new TableInfo.Column("longitude", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("gps_accuracy_m", new TableInfo.Column("gps_accuracy_m", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("speed_kmh", new TableInfo.Column("speed_kmh", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("heading_deg", new TableInfo.Column("heading_deg", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("peak_accel_ms2", new TableInfo.Column("peak_accel_ms2", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("impulse_duration_ms", new TableInfo.Column("impulse_duration_ms", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("severity", new TableInfo.Column("severity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("confidence", new TableInfo.Column("confidence", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("device_model", new TableInfo.Column("device_model", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("android_version", new TableInfo.Column("android_version", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("session_id", new TableInfo.Column("session_id", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadAnomalyEvents.put("synced", new TableInfo.Column("synced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysRoadAnomalyEvents = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesRoadAnomalyEvents = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoRoadAnomalyEvents = new TableInfo("road_anomaly_events", _columnsRoadAnomalyEvents, _foreignKeysRoadAnomalyEvents, _indicesRoadAnomalyEvents);
        final TableInfo _existingRoadAnomalyEvents = TableInfo.read(db, "road_anomaly_events");
        if (!_infoRoadAnomalyEvents.equals(_existingRoadAnomalyEvents)) {
          return new RoomOpenHelper.ValidationResult(false, "road_anomaly_events(com.roadpulse.android.data.model.RoadAnomalyEvent).\n"
                  + " Expected:\n" + _infoRoadAnomalyEvents + "\n"
                  + " Found:\n" + _existingRoadAnomalyEvents);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "114d55b868870e3584c0bfdc59d8d184", "0714aae9ddc040b8101bc3fa2126dc8c");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "road_anomaly_events");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `road_anomaly_events`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(RoadAnomalyDao.class, RoadAnomalyDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public RoadAnomalyDao roadAnomalyDao() {
    if (_roadAnomalyDao != null) {
      return _roadAnomalyDao;
    } else {
      synchronized(this) {
        if(_roadAnomalyDao == null) {
          _roadAnomalyDao = new RoadAnomalyDao_Impl(this);
        }
        return _roadAnomalyDao;
      }
    }
  }
}
