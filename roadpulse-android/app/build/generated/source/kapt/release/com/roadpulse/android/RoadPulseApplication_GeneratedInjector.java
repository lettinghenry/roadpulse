package com.roadpulse.android;

import dagger.hilt.InstallIn;
import dagger.hilt.codegen.OriginatingElement;
import dagger.hilt.components.SingletonComponent;
import dagger.hilt.internal.GeneratedEntryPoint;

@OriginatingElement(
    topLevelClass = RoadPulseApplication.class
)
@GeneratedEntryPoint
@InstallIn(SingletonComponent.class)
public interface RoadPulseApplication_GeneratedInjector {
  void injectRoadPulseApplication(RoadPulseApplication roadPulseApplication);
}
