package com.roadpulse.android.data.database;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.room.util.StringUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.roadpulse.android.data.model.RoadAnomalyEvent;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Float;
import java.lang.Integer;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.StringBuilder;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class RoadAnomalyDao_Impl implements RoadAnomalyDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<RoadAnomalyEvent> __insertionAdapterOfRoadAnomalyEvent;

  private final SharedSQLiteStatement __preparedStmtOfMarkEventSynced;

  private final SharedSQLiteStatement __preparedStmtOfDeleteOldestSyncedEvents;

  private final SharedSQLiteStatement __preparedStmtOfDeleteEventsOlderThan;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAllEvents;

  public RoadAnomalyDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfRoadAnomalyEvent = new EntityInsertionAdapter<RoadAnomalyEvent>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `road_anomaly_events` (`id`,`created_at`,`latitude`,`longitude`,`gps_accuracy_m`,`speed_kmh`,`heading_deg`,`peak_accel_ms2`,`impulse_duration_ms`,`severity`,`confidence`,`device_model`,`android_version`,`session_id`,`synced`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final RoadAnomalyEvent entity) {
        statement.bindString(1, entity.getId());
        statement.bindLong(2, entity.getCreatedAt());
        statement.bindDouble(3, entity.getLatitude());
        statement.bindDouble(4, entity.getLongitude());
        statement.bindDouble(5, entity.getGpsAccuracyM());
        statement.bindDouble(6, entity.getSpeedKmh());
        if (entity.getHeadingDeg() == null) {
          statement.bindNull(7);
        } else {
          statement.bindDouble(7, entity.getHeadingDeg());
        }
        statement.bindDouble(8, entity.getPeakAccelMs2());
        statement.bindLong(9, entity.getImpulseDurationMs());
        statement.bindLong(10, entity.getSeverity());
        statement.bindDouble(11, entity.getConfidence());
        statement.bindString(12, entity.getDeviceModel());
        statement.bindString(13, entity.getAndroidVersion());
        statement.bindString(14, entity.getSessionId());
        final int _tmp = entity.getSynced() ? 1 : 0;
        statement.bindLong(15, _tmp);
      }
    };
    this.__preparedStmtOfMarkEventSynced = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE road_anomaly_events SET synced = 1 WHERE id = ?";
        return _query;
      }
    };
    this.__preparedStmtOfDeleteOldestSyncedEvents = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM road_anomaly_events WHERE id IN (SELECT id FROM road_anomaly_events WHERE synced = 1 ORDER BY created_at ASC LIMIT ?)";
        return _query;
      }
    };
    this.__preparedStmtOfDeleteEventsOlderThan = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM road_anomaly_events WHERE created_at < ? AND synced = 1";
        return _query;
      }
    };
    this.__preparedStmtOfDeleteAllEvents = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM road_anomaly_events";
        return _query;
      }
    };
  }

  @Override
  public Object insertEvent(final RoadAnomalyEvent event,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfRoadAnomalyEvent.insertAndReturnId(event);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertEvents(final List<RoadAnomalyEvent> events,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfRoadAnomalyEvent.insert(events);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object markEventSynced(final String eventId,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfMarkEventSynced.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, eventId);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfMarkEventSynced.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteOldestSyncedEvents(final int limit,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteOldestSyncedEvents.acquire();
        int _argIndex = 1;
        _stmt.bindLong(_argIndex, limit);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteOldestSyncedEvents.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteEventsOlderThan(final long timestamp,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteEventsOlderThan.acquire();
        int _argIndex = 1;
        _stmt.bindLong(_argIndex, timestamp);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteEventsOlderThan.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAllEvents(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAllEvents.acquire();
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteAllEvents.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object getUnsyncedEvents(final Continuation<? super List<RoadAnomalyEvent>> $completion) {
    final String _sql = "SELECT * FROM road_anomaly_events WHERE synced = 0 ORDER BY created_at ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<RoadAnomalyEvent>>() {
      @Override
      @NonNull
      public List<RoadAnomalyEvent> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfGpsAccuracyM = CursorUtil.getColumnIndexOrThrow(_cursor, "gps_accuracy_m");
          final int _cursorIndexOfSpeedKmh = CursorUtil.getColumnIndexOrThrow(_cursor, "speed_kmh");
          final int _cursorIndexOfHeadingDeg = CursorUtil.getColumnIndexOrThrow(_cursor, "heading_deg");
          final int _cursorIndexOfPeakAccelMs2 = CursorUtil.getColumnIndexOrThrow(_cursor, "peak_accel_ms2");
          final int _cursorIndexOfImpulseDurationMs = CursorUtil.getColumnIndexOrThrow(_cursor, "impulse_duration_ms");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidence = CursorUtil.getColumnIndexOrThrow(_cursor, "confidence");
          final int _cursorIndexOfDeviceModel = CursorUtil.getColumnIndexOrThrow(_cursor, "device_model");
          final int _cursorIndexOfAndroidVersion = CursorUtil.getColumnIndexOrThrow(_cursor, "android_version");
          final int _cursorIndexOfSessionId = CursorUtil.getColumnIndexOrThrow(_cursor, "session_id");
          final int _cursorIndexOfSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "synced");
          final List<RoadAnomalyEvent> _result = new ArrayList<RoadAnomalyEvent>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final RoadAnomalyEvent _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final double _tmpLatitude;
            _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            final double _tmpLongitude;
            _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            final float _tmpGpsAccuracyM;
            _tmpGpsAccuracyM = _cursor.getFloat(_cursorIndexOfGpsAccuracyM);
            final float _tmpSpeedKmh;
            _tmpSpeedKmh = _cursor.getFloat(_cursorIndexOfSpeedKmh);
            final Float _tmpHeadingDeg;
            if (_cursor.isNull(_cursorIndexOfHeadingDeg)) {
              _tmpHeadingDeg = null;
            } else {
              _tmpHeadingDeg = _cursor.getFloat(_cursorIndexOfHeadingDeg);
            }
            final float _tmpPeakAccelMs2;
            _tmpPeakAccelMs2 = _cursor.getFloat(_cursorIndexOfPeakAccelMs2);
            final int _tmpImpulseDurationMs;
            _tmpImpulseDurationMs = _cursor.getInt(_cursorIndexOfImpulseDurationMs);
            final int _tmpSeverity;
            _tmpSeverity = _cursor.getInt(_cursorIndexOfSeverity);
            final float _tmpConfidence;
            _tmpConfidence = _cursor.getFloat(_cursorIndexOfConfidence);
            final String _tmpDeviceModel;
            _tmpDeviceModel = _cursor.getString(_cursorIndexOfDeviceModel);
            final String _tmpAndroidVersion;
            _tmpAndroidVersion = _cursor.getString(_cursorIndexOfAndroidVersion);
            final String _tmpSessionId;
            _tmpSessionId = _cursor.getString(_cursorIndexOfSessionId);
            final boolean _tmpSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfSynced);
            _tmpSynced = _tmp != 0;
            _item = new RoadAnomalyEvent(_tmpId,_tmpCreatedAt,_tmpLatitude,_tmpLongitude,_tmpGpsAccuracyM,_tmpSpeedKmh,_tmpHeadingDeg,_tmpPeakAccelMs2,_tmpImpulseDurationMs,_tmpSeverity,_tmpConfidence,_tmpDeviceModel,_tmpAndroidVersion,_tmpSessionId,_tmpSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getEventsBySession(final String sessionId,
      final Continuation<? super List<RoadAnomalyEvent>> $completion) {
    final String _sql = "SELECT * FROM road_anomaly_events WHERE session_id = ? ORDER BY created_at ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, sessionId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<RoadAnomalyEvent>>() {
      @Override
      @NonNull
      public List<RoadAnomalyEvent> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfGpsAccuracyM = CursorUtil.getColumnIndexOrThrow(_cursor, "gps_accuracy_m");
          final int _cursorIndexOfSpeedKmh = CursorUtil.getColumnIndexOrThrow(_cursor, "speed_kmh");
          final int _cursorIndexOfHeadingDeg = CursorUtil.getColumnIndexOrThrow(_cursor, "heading_deg");
          final int _cursorIndexOfPeakAccelMs2 = CursorUtil.getColumnIndexOrThrow(_cursor, "peak_accel_ms2");
          final int _cursorIndexOfImpulseDurationMs = CursorUtil.getColumnIndexOrThrow(_cursor, "impulse_duration_ms");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidence = CursorUtil.getColumnIndexOrThrow(_cursor, "confidence");
          final int _cursorIndexOfDeviceModel = CursorUtil.getColumnIndexOrThrow(_cursor, "device_model");
          final int _cursorIndexOfAndroidVersion = CursorUtil.getColumnIndexOrThrow(_cursor, "android_version");
          final int _cursorIndexOfSessionId = CursorUtil.getColumnIndexOrThrow(_cursor, "session_id");
          final int _cursorIndexOfSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "synced");
          final List<RoadAnomalyEvent> _result = new ArrayList<RoadAnomalyEvent>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final RoadAnomalyEvent _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final double _tmpLatitude;
            _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            final double _tmpLongitude;
            _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            final float _tmpGpsAccuracyM;
            _tmpGpsAccuracyM = _cursor.getFloat(_cursorIndexOfGpsAccuracyM);
            final float _tmpSpeedKmh;
            _tmpSpeedKmh = _cursor.getFloat(_cursorIndexOfSpeedKmh);
            final Float _tmpHeadingDeg;
            if (_cursor.isNull(_cursorIndexOfHeadingDeg)) {
              _tmpHeadingDeg = null;
            } else {
              _tmpHeadingDeg = _cursor.getFloat(_cursorIndexOfHeadingDeg);
            }
            final float _tmpPeakAccelMs2;
            _tmpPeakAccelMs2 = _cursor.getFloat(_cursorIndexOfPeakAccelMs2);
            final int _tmpImpulseDurationMs;
            _tmpImpulseDurationMs = _cursor.getInt(_cursorIndexOfImpulseDurationMs);
            final int _tmpSeverity;
            _tmpSeverity = _cursor.getInt(_cursorIndexOfSeverity);
            final float _tmpConfidence;
            _tmpConfidence = _cursor.getFloat(_cursorIndexOfConfidence);
            final String _tmpDeviceModel;
            _tmpDeviceModel = _cursor.getString(_cursorIndexOfDeviceModel);
            final String _tmpAndroidVersion;
            _tmpAndroidVersion = _cursor.getString(_cursorIndexOfAndroidVersion);
            final String _tmpSessionId;
            _tmpSessionId = _cursor.getString(_cursorIndexOfSessionId);
            final boolean _tmpSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfSynced);
            _tmpSynced = _tmp != 0;
            _item = new RoadAnomalyEvent(_tmpId,_tmpCreatedAt,_tmpLatitude,_tmpLongitude,_tmpGpsAccuracyM,_tmpSpeedKmh,_tmpHeadingDeg,_tmpPeakAccelMs2,_tmpImpulseDurationMs,_tmpSeverity,_tmpConfidence,_tmpDeviceModel,_tmpAndroidVersion,_tmpSessionId,_tmpSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getEventCount(final Continuation<? super Integer> $completion) {
    final String _sql = "SELECT COUNT(*) FROM road_anomaly_events";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final Integer _result;
          if (_cursor.moveToFirst()) {
            final int _tmp;
            _tmp = _cursor.getInt(0);
            _result = _tmp;
          } else {
            _result = 0;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getUnsyncedEventCount(final Continuation<? super Integer> $completion) {
    final String _sql = "SELECT COUNT(*) FROM road_anomaly_events WHERE synced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final Integer _result;
          if (_cursor.moveToFirst()) {
            final int _tmp;
            _tmp = _cursor.getInt(0);
            _result = _tmp;
          } else {
            _result = 0;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getEventsByTimeRange(final long startTime, final long endTime,
      final Continuation<? super List<RoadAnomalyEvent>> $completion) {
    final String _sql = "SELECT * FROM road_anomaly_events WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 2);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, startTime);
    _argIndex = 2;
    _statement.bindLong(_argIndex, endTime);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<RoadAnomalyEvent>>() {
      @Override
      @NonNull
      public List<RoadAnomalyEvent> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfGpsAccuracyM = CursorUtil.getColumnIndexOrThrow(_cursor, "gps_accuracy_m");
          final int _cursorIndexOfSpeedKmh = CursorUtil.getColumnIndexOrThrow(_cursor, "speed_kmh");
          final int _cursorIndexOfHeadingDeg = CursorUtil.getColumnIndexOrThrow(_cursor, "heading_deg");
          final int _cursorIndexOfPeakAccelMs2 = CursorUtil.getColumnIndexOrThrow(_cursor, "peak_accel_ms2");
          final int _cursorIndexOfImpulseDurationMs = CursorUtil.getColumnIndexOrThrow(_cursor, "impulse_duration_ms");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidence = CursorUtil.getColumnIndexOrThrow(_cursor, "confidence");
          final int _cursorIndexOfDeviceModel = CursorUtil.getColumnIndexOrThrow(_cursor, "device_model");
          final int _cursorIndexOfAndroidVersion = CursorUtil.getColumnIndexOrThrow(_cursor, "android_version");
          final int _cursorIndexOfSessionId = CursorUtil.getColumnIndexOrThrow(_cursor, "session_id");
          final int _cursorIndexOfSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "synced");
          final List<RoadAnomalyEvent> _result = new ArrayList<RoadAnomalyEvent>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final RoadAnomalyEvent _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final double _tmpLatitude;
            _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            final double _tmpLongitude;
            _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            final float _tmpGpsAccuracyM;
            _tmpGpsAccuracyM = _cursor.getFloat(_cursorIndexOfGpsAccuracyM);
            final float _tmpSpeedKmh;
            _tmpSpeedKmh = _cursor.getFloat(_cursorIndexOfSpeedKmh);
            final Float _tmpHeadingDeg;
            if (_cursor.isNull(_cursorIndexOfHeadingDeg)) {
              _tmpHeadingDeg = null;
            } else {
              _tmpHeadingDeg = _cursor.getFloat(_cursorIndexOfHeadingDeg);
            }
            final float _tmpPeakAccelMs2;
            _tmpPeakAccelMs2 = _cursor.getFloat(_cursorIndexOfPeakAccelMs2);
            final int _tmpImpulseDurationMs;
            _tmpImpulseDurationMs = _cursor.getInt(_cursorIndexOfImpulseDurationMs);
            final int _tmpSeverity;
            _tmpSeverity = _cursor.getInt(_cursorIndexOfSeverity);
            final float _tmpConfidence;
            _tmpConfidence = _cursor.getFloat(_cursorIndexOfConfidence);
            final String _tmpDeviceModel;
            _tmpDeviceModel = _cursor.getString(_cursorIndexOfDeviceModel);
            final String _tmpAndroidVersion;
            _tmpAndroidVersion = _cursor.getString(_cursorIndexOfAndroidVersion);
            final String _tmpSessionId;
            _tmpSessionId = _cursor.getString(_cursorIndexOfSessionId);
            final boolean _tmpSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfSynced);
            _tmpSynced = _tmp != 0;
            _item = new RoadAnomalyEvent(_tmpId,_tmpCreatedAt,_tmpLatitude,_tmpLongitude,_tmpGpsAccuracyM,_tmpSpeedKmh,_tmpHeadingDeg,_tmpPeakAccelMs2,_tmpImpulseDurationMs,_tmpSeverity,_tmpConfidence,_tmpDeviceModel,_tmpAndroidVersion,_tmpSessionId,_tmpSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getEventsBySeverity(final int minSeverity,
      final Continuation<? super List<RoadAnomalyEvent>> $completion) {
    final String _sql = "SELECT * FROM road_anomaly_events WHERE severity >= ? ORDER BY created_at DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, minSeverity);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<RoadAnomalyEvent>>() {
      @Override
      @NonNull
      public List<RoadAnomalyEvent> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "created_at");
          final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
          final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
          final int _cursorIndexOfGpsAccuracyM = CursorUtil.getColumnIndexOrThrow(_cursor, "gps_accuracy_m");
          final int _cursorIndexOfSpeedKmh = CursorUtil.getColumnIndexOrThrow(_cursor, "speed_kmh");
          final int _cursorIndexOfHeadingDeg = CursorUtil.getColumnIndexOrThrow(_cursor, "heading_deg");
          final int _cursorIndexOfPeakAccelMs2 = CursorUtil.getColumnIndexOrThrow(_cursor, "peak_accel_ms2");
          final int _cursorIndexOfImpulseDurationMs = CursorUtil.getColumnIndexOrThrow(_cursor, "impulse_duration_ms");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidence = CursorUtil.getColumnIndexOrThrow(_cursor, "confidence");
          final int _cursorIndexOfDeviceModel = CursorUtil.getColumnIndexOrThrow(_cursor, "device_model");
          final int _cursorIndexOfAndroidVersion = CursorUtil.getColumnIndexOrThrow(_cursor, "android_version");
          final int _cursorIndexOfSessionId = CursorUtil.getColumnIndexOrThrow(_cursor, "session_id");
          final int _cursorIndexOfSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "synced");
          final List<RoadAnomalyEvent> _result = new ArrayList<RoadAnomalyEvent>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final RoadAnomalyEvent _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final double _tmpLatitude;
            _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
            final double _tmpLongitude;
            _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
            final float _tmpGpsAccuracyM;
            _tmpGpsAccuracyM = _cursor.getFloat(_cursorIndexOfGpsAccuracyM);
            final float _tmpSpeedKmh;
            _tmpSpeedKmh = _cursor.getFloat(_cursorIndexOfSpeedKmh);
            final Float _tmpHeadingDeg;
            if (_cursor.isNull(_cursorIndexOfHeadingDeg)) {
              _tmpHeadingDeg = null;
            } else {
              _tmpHeadingDeg = _cursor.getFloat(_cursorIndexOfHeadingDeg);
            }
            final float _tmpPeakAccelMs2;
            _tmpPeakAccelMs2 = _cursor.getFloat(_cursorIndexOfPeakAccelMs2);
            final int _tmpImpulseDurationMs;
            _tmpImpulseDurationMs = _cursor.getInt(_cursorIndexOfImpulseDurationMs);
            final int _tmpSeverity;
            _tmpSeverity = _cursor.getInt(_cursorIndexOfSeverity);
            final float _tmpConfidence;
            _tmpConfidence = _cursor.getFloat(_cursorIndexOfConfidence);
            final String _tmpDeviceModel;
            _tmpDeviceModel = _cursor.getString(_cursorIndexOfDeviceModel);
            final String _tmpAndroidVersion;
            _tmpAndroidVersion = _cursor.getString(_cursorIndexOfAndroidVersion);
            final String _tmpSessionId;
            _tmpSessionId = _cursor.getString(_cursorIndexOfSessionId);
            final boolean _tmpSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfSynced);
            _tmpSynced = _tmp != 0;
            _item = new RoadAnomalyEvent(_tmpId,_tmpCreatedAt,_tmpLatitude,_tmpLongitude,_tmpGpsAccuracyM,_tmpSpeedKmh,_tmpHeadingDeg,_tmpPeakAccelMs2,_tmpImpulseDurationMs,_tmpSeverity,_tmpConfidence,_tmpDeviceModel,_tmpAndroidVersion,_tmpSessionId,_tmpSynced);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<Integer> observeUnsyncedEventCount() {
    final String _sql = "SELECT COUNT(*) FROM road_anomaly_events WHERE synced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"road_anomaly_events"}, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final Integer _result;
          if (_cursor.moveToFirst()) {
            final int _tmp;
            _tmp = _cursor.getInt(0);
            _result = _tmp;
          } else {
            _result = 0;
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object markEventsSynced(final List<String> eventIds,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final StringBuilder _stringBuilder = StringUtil.newStringBuilder();
        _stringBuilder.append("UPDATE road_anomaly_events SET synced = 1 WHERE id IN (");
        final int _inputSize = eventIds.size();
        StringUtil.appendPlaceholders(_stringBuilder, _inputSize);
        _stringBuilder.append(")");
        final String _sql = _stringBuilder.toString();
        final SupportSQLiteStatement _stmt = __db.compileStatement(_sql);
        int _argIndex = 1;
        for (String _item : eventIds) {
          _stmt.bindString(_argIndex, _item);
          _argIndex++;
        }
        __db.beginTransaction();
        try {
          _stmt.executeUpdateDelete();
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
