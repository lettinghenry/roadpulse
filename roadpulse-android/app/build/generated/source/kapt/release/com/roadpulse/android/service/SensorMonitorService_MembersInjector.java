package com.roadpulse.android.service;

import com.roadpulse.android.data.detector.EventDetector;
import com.roadpulse.android.data.processor.SensorDataProcessor;
import com.roadpulse.android.data.provider.LocationProvider;
import com.roadpulse.android.data.session.SessionManager;
import com.roadpulse.android.di.DefaultDispatcher;
import com.roadpulse.android.di.IoDispatcher;
import dagger.MembersInjector;
import dagger.internal.DaggerGenerated;
import dagger.internal.InjectedFieldSignature;
import dagger.internal.QualifierMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import kotlinx.coroutines.CoroutineDispatcher;

@QualifierMetadata({
    "com.roadpulse.android.di.IoDispatcher",
    "com.roadpulse.android.di.DefaultDispatcher"
})
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
public final class SensorMonitorService_MembersInjector implements MembersInjector<SensorMonitorService> {
  private final Provider<SensorDataProcessor> sensorDataProcessorProvider;

  private final Provider<EventDetector> eventDetectorProvider;

  private final Provider<LocationProvider> locationProvider;

  private final Provider<SessionManager> sessionManagerProvider;

  private final Provider<CoroutineDispatcher> ioDispatcherProvider;

  private final Provider<CoroutineDispatcher> defaultDispatcherProvider;

  public SensorMonitorService_MembersInjector(
      Provider<SensorDataProcessor> sensorDataProcessorProvider,
      Provider<EventDetector> eventDetectorProvider, Provider<LocationProvider> locationProvider,
      Provider<SessionManager> sessionManagerProvider,
      Provider<CoroutineDispatcher> ioDispatcherProvider,
      Provider<CoroutineDispatcher> defaultDispatcherProvider) {
    this.sensorDataProcessorProvider = sensorDataProcessorProvider;
    this.eventDetectorProvider = eventDetectorProvider;
    this.locationProvider = locationProvider;
    this.sessionManagerProvider = sessionManagerProvider;
    this.ioDispatcherProvider = ioDispatcherProvider;
    this.defaultDispatcherProvider = defaultDispatcherProvider;
  }

  public static MembersInjector<SensorMonitorService> create(
      Provider<SensorDataProcessor> sensorDataProcessorProvider,
      Provider<EventDetector> eventDetectorProvider, Provider<LocationProvider> locationProvider,
      Provider<SessionManager> sessionManagerProvider,
      Provider<CoroutineDispatcher> ioDispatcherProvider,
      Provider<CoroutineDispatcher> defaultDispatcherProvider) {
    return new SensorMonitorService_MembersInjector(sensorDataProcessorProvider, eventDetectorProvider, locationProvider, sessionManagerProvider, ioDispatcherProvider, defaultDispatcherProvider);
  }

  @Override
  public void injectMembers(SensorMonitorService instance) {
    injectSensorDataProcessor(instance, sensorDataProcessorProvider.get());
    injectEventDetector(instance, eventDetectorProvider.get());
    injectLocationProvider(instance, locationProvider.get());
    injectSessionManager(instance, sessionManagerProvider.get());
    injectIoDispatcher(instance, ioDispatcherProvider.get());
    injectDefaultDispatcher(instance, defaultDispatcherProvider.get());
  }

  @InjectedFieldSignature("com.roadpulse.android.service.SensorMonitorService.sensorDataProcessor")
  public static void injectSensorDataProcessor(SensorMonitorService instance,
      SensorDataProcessor sensorDataProcessor) {
    instance.sensorDataProcessor = sensorDataProcessor;
  }

  @InjectedFieldSignature("com.roadpulse.android.service.SensorMonitorService.eventDetector")
  public static void injectEventDetector(SensorMonitorService instance,
      EventDetector eventDetector) {
    instance.eventDetector = eventDetector;
  }

  @InjectedFieldSignature("com.roadpulse.android.service.SensorMonitorService.locationProvider")
  public static void injectLocationProvider(SensorMonitorService instance,
      LocationProvider locationProvider) {
    instance.locationProvider = locationProvider;
  }

  @InjectedFieldSignature("com.roadpulse.android.service.SensorMonitorService.sessionManager")
  public static void injectSessionManager(SensorMonitorService instance,
      SessionManager sessionManager) {
    instance.sessionManager = sessionManager;
  }

  @InjectedFieldSignature("com.roadpulse.android.service.SensorMonitorService.ioDispatcher")
  @IoDispatcher
  public static void injectIoDispatcher(SensorMonitorService instance,
      CoroutineDispatcher ioDispatcher) {
    instance.ioDispatcher = ioDispatcher;
  }

  @InjectedFieldSignature("com.roadpulse.android.service.SensorMonitorService.defaultDispatcher")
  @DefaultDispatcher
  public static void injectDefaultDispatcher(SensorMonitorService instance,
      CoroutineDispatcher defaultDispatcher) {
    instance.defaultDispatcher = defaultDispatcher;
  }
}
