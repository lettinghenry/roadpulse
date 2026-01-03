package com.roadpulse.android.data.classifier;

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
public final class EventClassifier_Factory implements Factory<EventClassifier> {
  @Override
  public EventClassifier get() {
    return newInstance();
  }

  public static EventClassifier_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static EventClassifier newInstance() {
    return new EventClassifier();
  }

  private static final class InstanceHolder {
    private static final EventClassifier_Factory INSTANCE = new EventClassifier_Factory();
  }
}
