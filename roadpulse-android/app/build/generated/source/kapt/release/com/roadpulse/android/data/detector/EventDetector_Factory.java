package com.roadpulse.android.data.detector;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
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
public final class EventDetector_Factory implements Factory<EventDetector> {
  @Override
  public EventDetector get() {
    return newInstance();
  }

  public static EventDetector_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static EventDetector newInstance() {
    return new EventDetector();
  }

  private static final class InstanceHolder {
    private static final EventDetector_Factory INSTANCE = new EventDetector_Factory();
  }
}
