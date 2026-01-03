package com.roadpulse.android.di;

import com.roadpulse.android.data.database.RoadAnomalyDao;
import com.roadpulse.android.data.database.RoadPulseDatabase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class DatabaseModule_ProvideRoadAnomalyDaoFactory implements Factory<RoadAnomalyDao> {
  private final Provider<RoadPulseDatabase> databaseProvider;

  public DatabaseModule_ProvideRoadAnomalyDaoFactory(Provider<RoadPulseDatabase> databaseProvider) {
    this.databaseProvider = databaseProvider;
  }

  @Override
  public RoadAnomalyDao get() {
    return provideRoadAnomalyDao(databaseProvider.get());
  }

  public static DatabaseModule_ProvideRoadAnomalyDaoFactory create(
      Provider<RoadPulseDatabase> databaseProvider) {
    return new DatabaseModule_ProvideRoadAnomalyDaoFactory(databaseProvider);
  }

  public static RoadAnomalyDao provideRoadAnomalyDao(RoadPulseDatabase database) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideRoadAnomalyDao(database));
  }
}
