import React, { useState } from 'react';
import { MapContainer } from './MapContainer';
import { AnomalyMarkers } from './AnomalyMarkers';
import { EventPopup } from './EventPopup';
import { RoadAnomalyEvent, LatLng } from '../types';

// Example component showing how to integrate EventPopup with the map
interface MapWithPopupProps {
  events: RoadAnomalyEvent[];
}

export const MapWithPopupExample: React.FC<MapWithPopupProps> = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState<RoadAnomalyEvent | null>(null);
  const [popupPosition, setPopupPosition] = useState<LatLng | undefined>();

  const handleMarkerClick = (event: RoadAnomalyEvent) => {
    setSelectedEvent(event);
    setPopupPosition({ lat: event.latitude, lng: event.longitude });
  };

  const handleClosePopup = () => {
    setSelectedEvent(null);
    setPopupPosition(undefined);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <MapContainer>
        <AnomalyMarkers 
          events={events} 
          onMarkerClick={handleMarkerClick}
        />
      </MapContainer>
      
      <EventPopup
        event={selectedEvent}
        position={popupPosition}
        onClose={handleClosePopup}
        isVisible={selectedEvent !== null}
      />
    </div>
  );
};

export default MapWithPopupExample;