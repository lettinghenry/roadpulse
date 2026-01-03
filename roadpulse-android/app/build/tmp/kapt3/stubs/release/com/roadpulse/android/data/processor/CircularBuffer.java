package com.roadpulse.android.data.processor;

/**
 * Simple circular buffer implementation for noise filtering
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000*\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010!\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0010 \n\u0002\b\u0002\b\u0002\u0018\u0000*\u0004\b\u0000\u0010\u00012\u00020\u0002B\r\u0012\u0006\u0010\u0003\u001a\u00020\u0004\u00a2\u0006\u0002\u0010\u0005J\u0013\u0010\b\u001a\u00020\t2\u0006\u0010\n\u001a\u00028\u0000\u00a2\u0006\u0002\u0010\u000bJ\f\u0010\f\u001a\b\u0012\u0004\u0012\u00028\u00000\rJ\u0006\u0010\u000e\u001a\u00020\u0004R\u0014\u0010\u0006\u001a\b\u0012\u0004\u0012\u00028\u00000\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u000f"}, d2 = {"Lcom/roadpulse/android/data/processor/CircularBuffer;", "T", "", "capacity", "", "(I)V", "buffer", "", "add", "", "item", "(Ljava/lang/Object;)V", "getAll", "", "size", "app_release"})
final class CircularBuffer<T extends java.lang.Object> {
    private final int capacity = 0;
    @org.jetbrains.annotations.NotNull
    private final java.util.List<T> buffer = null;
    
    public CircularBuffer(int capacity) {
        super();
    }
    
    public final void add(T item) {
    }
    
    public final int size() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.util.List<T> getAll() {
        return null;
    }
}