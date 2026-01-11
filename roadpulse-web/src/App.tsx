import React from 'react';
import { AppProvider } from './context/AppContext';
import { IntegratedMapApplication } from './components/IntegratedMapApplication';
import './styles/accessibility.css';
import './App.css';

function App() {
  return (
    <AppProvider>
      <IntegratedMapApplication
        initialCenter={{ lat: 40.7128, lng: -74.0060 }} // NYC
        initialZoom={12}
        enableOfflineMode={true}
        enablePerformanceOptimizations={true}
        enableAccessibilityFeatures={true}
        className="roadpulse-app"
      />
    </AppProvider>
  );
}

export default App;