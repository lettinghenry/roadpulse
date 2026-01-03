package com.roadpulse.android.data.session;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import kotlinx.coroutines.CoroutineDispatcher;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("com.roadpulse.android.di.IoDispatcher")
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava"
})
public final class SessionManager_Factory implements Factory<SessionManager> {
  private final Provider<CoroutineDispatcher> ioDispatcherProvider;

  public SessionManager_Factory(Provider<CoroutineDispatcher> ioDispatcherProvider) {
    this.ioDispatcherProvider = ioDispatcherProvider;
  }

  @Override
  public SessionManager get() {
    return newInstance(ioDispatcherProvider.get());
  }

  public static SessionManager_Factory create(Provider<CoroutineDispatcher> ioDispatcherProvider) {
    return new SessionManager_Factory(ioDispatcherProvider);
  }

  public static SessionManager newInstance(CoroutineDispatcher ioDispatcher) {
    return new SessionManager(ioDispatcher);
  }
}
