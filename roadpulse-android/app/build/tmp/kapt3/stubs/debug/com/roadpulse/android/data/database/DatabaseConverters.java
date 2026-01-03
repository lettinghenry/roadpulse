package com.roadpulse.android.data.database;

/**
 * Type converters for Room database to handle custom data types.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J\u0019\u0010\u0003\u001a\u0004\u0018\u00010\u00042\b\u0010\u0005\u001a\u0004\u0018\u00010\u0006H\u0007\u00a2\u0006\u0002\u0010\u0007J\u0014\u0010\b\u001a\u0004\u0018\u00010\t2\b\u0010\n\u001a\u0004\u0018\u00010\u000bH\u0007J\u0019\u0010\f\u001a\u0004\u0018\u00010\u00062\b\u0010\r\u001a\u0004\u0018\u00010\u0004H\u0007\u00a2\u0006\u0002\u0010\u000eJ\u0014\u0010\u000f\u001a\u0004\u0018\u00010\u000b2\b\u0010\u0010\u001a\u0004\u0018\u00010\tH\u0007\u00a8\u0006\u0011"}, d2 = {"Lcom/roadpulse/android/data/database/DatabaseConverters;", "", "()V", "fromTimestamp", "Ljava/time/Instant;", "value", "", "(Ljava/lang/Long;)Ljava/time/Instant;", "fromUUID", "", "uuid", "Ljava/util/UUID;", "instantToTimestamp", "instant", "(Ljava/time/Instant;)Ljava/lang/Long;", "toUUID", "uuidString", "app_debug"})
public final class DatabaseConverters {
    
    public DatabaseConverters() {
        super();
    }
    
    @androidx.room.TypeConverter
    @org.jetbrains.annotations.Nullable
    public final java.time.Instant fromTimestamp(@org.jetbrains.annotations.Nullable
    java.lang.Long value) {
        return null;
    }
    
    @androidx.room.TypeConverter
    @org.jetbrains.annotations.Nullable
    public final java.lang.Long instantToTimestamp(@org.jetbrains.annotations.Nullable
    java.time.Instant instant) {
        return null;
    }
    
    @androidx.room.TypeConverter
    @org.jetbrains.annotations.Nullable
    public final java.lang.String fromUUID(@org.jetbrains.annotations.Nullable
    java.util.UUID uuid) {
        return null;
    }
    
    @androidx.room.TypeConverter
    @org.jetbrains.annotations.Nullable
    public final java.util.UUID toUUID(@org.jetbrains.annotations.Nullable
    java.lang.String uuidString) {
        return null;
    }
}