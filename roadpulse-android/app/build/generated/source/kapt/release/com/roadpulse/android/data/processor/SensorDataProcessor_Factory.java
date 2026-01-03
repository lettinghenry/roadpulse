package com.roadpulse.android.data.processor;

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
public final class SensorDataProcessor_Factory implements Factory<SensorDataProcessor> {
  @Override
  public SensorDataProcessor get() {
    return newInstance();
  }

  public static SensorDataProcessor_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static SensorDataProcessor newInstance() {
    return new SensorDataProcessor();
  }

  private static final class InstanceHolder {
    private static final SensorDataProcessor_Factory INSTANCE = new SensorDataProcessor_Factory();
  }
}
