package com.roadpulse.android.data.repository;

import com.roadpulse.android.data.database.RoadAnomalyDao;
import com.roadpulse.android.data.session.SessionManager;
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
public final class EventRepository_Factory implements Factory<EventRepository> {
  private final Provider<RoadAnomalyDao> roadAnomalyDaoProvider;

  private final Provider<SessionManager> sessionManagerProvider;

  private final Provider<CoroutineDispatcher> ioDispatcherProvider;

  public EventRepository_Factory(Provider<RoadAnomalyDao> roadAnomalyDaoProvider,
      Provider<SessionManager> sessionManagerProvider,
      Provider<CoroutineDispatcher> ioDispatcherProvider) {
    this.roadAnomalyDaoProvider = roadAnomalyDaoProvider;
    this.sessionManagerProvider = sessionManagerProvider;
    this.ioDispatcherProvider = ioDispatcherProvider;
  }

  @Override
  public EventRepository get() {
    return newInstance(roadAnomalyDaoProvider.get(), sessionManagerProvider.get(), ioDispatcherProvider.get());
  }

  public static EventRepository_Factory create(Provider<RoadAnomalyDao> roadAnomalyDaoProvider,
      Provider<SessionManager> sessionManagerProvider,
      Provider<CoroutineDispatcher> ioDispatcherProvider) {
    return new EventRepository_Factory(roadAnomalyDaoProvider, sessionManagerProvider, ioDispatcherProvider);
  }

  public static EventRepository newInstance(RoadAnomalyDao roadAnomalyDao,
      SessionManager sessionManager, CoroutineDispatcher ioDispatcher) {
    return new EventRepository(roadAnomalyDao, sessionManager, ioDispatcher);
  }
}
