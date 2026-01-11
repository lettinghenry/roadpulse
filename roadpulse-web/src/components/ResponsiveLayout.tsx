import React, { useEffect, useState } from 'react';
import { useResponsive, initializeResponsiveSystem } from '../utils/responsive';
import './ResponsiveLayout.css';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = ''
}) => {
  const { deviceType, isTouchEnabled, config } = useResponsive();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize responsive system
  useEffect(() => {
    const cleanup = initializeResponsiveSystem();
    setIsInitialized(true);
    
    return cleanup;
  }, []);

  // Add device-specific classes
  const layoutClasses = [
    'responsive-layout',
    `device-${deviceType}`,
    isTouchEnabled ? 'touch-enabled' : 'no-touch',
    className
  ].filter(Boolean).join(' ');

  if (!isInitialized) {
    return <div className="responsive-layout-loading">Loading...</div>;
  }

  return (
    <div 
      className={layoutClasses}
      data-device-type={deviceType}
      data-touch-enabled={isTouchEnabled}
      style={{
        '--cluster-radius': `${config.clusterRadius}px`,
        '--popup-max-width': config.popupMaxWidth,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default ResponsiveLayout;