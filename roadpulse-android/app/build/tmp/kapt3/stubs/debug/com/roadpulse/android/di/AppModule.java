package com.roadpulse.android.di;

/**
 * Main Hilt module for application-wide dependencies.
 */
@dagger.Module
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u0012\u0010\u0003\u001a\u00020\u00042\b\b\u0001\u0010\u0005\u001a\u00020\u0004H\u0007J\b\u0010\u0006\u001a\u00020\u0007H\u0007J\b\u0010\b\u001a\u00020\u0007H\u0007J\b\u0010\t\u001a\u00020\u0007H\u0007\u00a8\u0006\n"}, d2 = {"Lcom/roadpulse/android/di/AppModule;", "", "()V", "provideApplicationContext", "Landroid/content/Context;", "context", "provideDefaultDispatcher", "Lkotlinx/coroutines/CoroutineDispatcher;", "provideIoDispatcher", "provideMainDispatcher", "app_debug"})
@dagger.hilt.InstallIn(value = {dagger.hilt.components.SingletonComponent.class})
public final class AppModule {
    @org.jetbrains.annotations.NotNull
    public static final com.roadpulse.android.di.AppModule INSTANCE = null;
    
    private AppModule() {
        super();
    }
    
    @dagger.Provides
    @javax.inject.Singleton
    @dagger.hilt.android.qualifiers.ApplicationContext
    @org.jetbrains.annotations.NotNull
    public final android.content.Context provideApplicationContext(@dagger.hilt.android.qualifiers.ApplicationContext
    @org.jetbrains.annotations.NotNull
    android.content.Context context) {
        return null;
    }
    
    @dagger.Provides
    @IoDispatcher
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.CoroutineDispatcher provideIoDispatcher() {
        return null;
    }
    
    @dagger.Provides
    @MainDispatcher
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.CoroutineDispatcher provideMainDispatcher() {
        return null;
    }
    
    @dagger.Provides
    @DefaultDispatcher
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.CoroutineDispatcher provideDefaultDispatcher() {
        return null;
    }
}