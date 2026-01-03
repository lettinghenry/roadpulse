package com.roadpulse.android.di;

import android.content.Context;
import com.roadpulse.android.data.database.RoadPulseDatabase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class DatabaseModule_ProvideRoadPulseDatabaseFactory implements Factory<RoadPulseDatabase> {
  private final Provider<Context> contextProvider;

  public DatabaseModule_ProvideRoadPulseDatabaseFactory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public RoadPulseDatabase get() {
    return provideRoadPulseDatabase(contextProvider.get());
  }

  public static DatabaseModule_ProvideRoadPulseDatabaseFactory create(
      Provider<Context> contextProvider) {
    return new DatabaseModule_ProvideRoadPulseDatabaseFactory(contextProvider);
  }

  public static RoadPulseDatabase provideRoadPulseDatabase(Context context) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideRoadPulseDatabase(context));
  }
}
